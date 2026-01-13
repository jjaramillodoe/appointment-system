import dbConnect from '@/lib/mongodb';
import Report from '@/models/Report';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import AppointmentSlot from '@/models/AppointmentSlot';
import HubConfig from '@/models/HubConfig';

// Generate report data and update report status
export async function generateReportData(reportId: string, type: string, parameters: any) {
  try {
    await dbConnect();
    
    let reportData: any = {};
    
    switch (type) {
      case 'appointments':
        reportData = await generateAppointmentReport(parameters);
        break;
      case 'users':
        reportData = await generateUserReport(parameters);
        break;
      case 'hubs':
        reportData = await generateHubReport(parameters);
        break;
      case 'capacity':
        reportData = await generateCapacityReport(parameters);
        break;
      case 'daily_summary':
        reportData = await generateDailySummaryReport(parameters);
        break;
      case 'weekly_trends':
        reportData = await generateWeeklyTrendsReport(parameters);
        break;
      case 'user_insights':
        reportData = await generateUserInsightsReport(parameters);
        break;
      default:
        throw new Error(`Unknown report type: ${type}`);
    }

    // Update report status to ready
    await Report.findByIdAndUpdate(reportId, {
      status: 'ready',
      filePath: `reports/${reportId}.json`
    });


  } catch (error) {
    console.error('Error generating report data:', error);
    await Report.findByIdAndUpdate(reportId, { status: 'failed' });
    throw error;
  }
}

// Generate appointment report
async function generateAppointmentReport(parameters: any) {
  const { startDate, endDate, hubName } = parameters;
  
  const filter: any = {};
  if (startDate && endDate) {
    filter.appointmentDate = { $gte: startDate, $lte: endDate };
  }
  if (hubName) {
    filter.hubName = hubName;
  }

  const appointments = await Appointment.find(filter)
    .populate('userId', 'firstName lastName email')
    .sort({ appointmentDate: 1 });

  const stats = {
    total: appointments.length,
    byStatus: {
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      completed: appointments.filter(a => a.status === 'completed').length
    },
    byHub: appointments.reduce((acc: any, app) => {
      acc[app.hubName] = (acc[app.hubName] || 0) + 1;
      return acc;
    }, {}),
    byDate: appointments.reduce((acc: any, app) => {
      acc[app.appointmentDate] = (acc[app.appointmentDate] || 0) + 1;
      return acc;
    }, {})
  };

  return { appointments, stats };
}

// Generate user report
async function generateUserReport(parameters: any) {
  const { hubName } = parameters;
  
  const filter: any = {};
  if (hubName) {
    filter['closestHub.name'] = hubName;
  }

  const users = await User.find(filter).sort({ createdAt: -1 });

  const stats = {
    total: users.length,
    byEducationLevel: users.reduce((acc: any, user) => {
      acc[user.educationLevel] = (acc[user.educationLevel] || 0) + 1;
      return acc;
    }, {}),
    byEmploymentStatus: users.reduce((acc: any, user) => {
      acc[user.employmentStatus] = (acc[user.employmentStatus] || 0) + 1;
      return acc;
    }, {}),
    byProgramInterest: users.reduce((acc: any, user) => {
      user.programInterests?.forEach((program: string) => {
        acc[program] = (acc[program] || 0) + 1;
      });
      return acc;
    }, {}),
    byHub: users.reduce((acc: any, user) => {
      const hubName = user.closestHub?.name || 'Unknown';
      acc[hubName] = (acc[hubName] || 0) + 1;
      return acc;
    }, {})
  };

  return { users, stats };
}

// Generate hub report
async function generateHubReport(parameters: any) {
  const { startDate, endDate } = parameters;
  
  const hubConfigs = await HubConfig.find();
  const appointments = await Appointment.find({
    appointmentDate: { $gte: startDate || '2025-01-01', $lte: endDate || '2025-12-31' }
  });

  const hubStats = hubConfigs.map(hub => {
    const hubAppointments = appointments.filter(a => a.hubName === hub.hubName);
    return {
      hubName: hub.hubName,
      totalAppointments: hubAppointments.length,
      confirmedAppointments: hubAppointments.filter(a => a.status === 'confirmed').length,
      cancelledAppointments: hubAppointments.filter(a => a.status === 'cancelled').length,
      daysOff: hub.daysOff?.length || 0,
      customSlots: Object.keys(hub.customSlots || {}).length
    };
  });

  return { hubStats, totalHubs: hubConfigs.length };
}

// Generate capacity report
async function generateCapacityReport(parameters: any) {
  const { date, hubName } = parameters;
  
  const filter: any = {};
  if (date) filter.date = date;
  if (hubName) filter.hubName = hubName;

  const slots = await AppointmentSlot.find(filter);
  
  const capacityStats = slots.map(slot => ({
    hubName: slot.hubName,
    date: slot.date,
    time: slot.time,
    capacity: slot.capacity,
    bookedCount: slot.bookedCount,
    utilizationRate: (slot.bookedCount / slot.capacity) * 100,
    isActive: slot.isActive
  }));

  const overallStats = {
    totalSlots: slots.length,
    activeSlots: slots.filter(s => s.isActive).length,
    averageUtilization: slots.reduce((sum, slot) => sum + (slot.bookedCount / slot.capacity), 0) / slots.length * 100,
    highUtilizationSlots: slots.filter(slot => (slot.bookedCount / slot.capacity) >= 0.8).length
  };

  return { capacityStats, overallStats };
}

// Generate daily summary report
async function generateDailySummaryReport(parameters: any) {
  const today = new Date().toISOString().split('T')[0];
  
  const appointments = await Appointment.find({ appointmentDate: today })
    .populate('userId', 'firstName lastName email');

  const stats = {
    total: appointments.length,
    byStatus: {
      pending: appointments.filter(a => a.status === 'pending').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      completed: appointments.filter(a => a.status === 'completed').length
    },
    byHub: appointments.reduce((acc: any, app) => {
      acc[app.hubName] = (acc[app.hubName] || 0) + 1;
      return acc;
    }, {})
  };

  return { appointments, stats, date: today };
}

// Generate weekly trends report
async function generateWeeklyTrendsReport(parameters: any) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  
  const appointments = await Appointment.find({
    appointmentDate: { 
      $gte: startDate.toISOString().split('T')[0], 
      $lte: endDate.toISOString().split('T')[0] 
    }
  });

  const dailyTrends: { [key: string]: number } = {};
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    dailyTrends[dateStr] = appointments.filter(a => a.appointmentDate === dateStr).length;
  }

  return { dailyTrends, totalAppointments: appointments.length };
}

// Generate user insights report
async function generateUserInsightsReport(parameters: any) {
  const users = await User.find();
  
  const insights = {
    totalUsers: users.length,
    demographics: {
      byAge: users.reduce((acc: any, user) => {
        const age = new Date().getFullYear() - new Date(user.dateOfBirth).getFullYear();
        const ageGroup = age < 25 ? '18-24' : age < 35 ? '25-34' : age < 45 ? '35-44' : '45+';
        acc[ageGroup] = (acc[ageGroup] || 0) + 1;
        return acc;
      }, {}),
      byGender: users.reduce((acc: any, user) => {
        acc[user.sex] = (acc[user.sex] || 0) + 1;
        return acc;
      }, {}),
      byLanguage: users.reduce((acc: any, user) => {
        acc[user.preferredLanguage] = (acc[user.preferredLanguage] || 0) + 1;
        return acc;
      }, {})
    },
    barriers: users.reduce((acc: any, user) => {
      user.barriersToLearning?.forEach((barrier: string) => {
        acc[barrier] = (acc[barrier] || 0) + 1;
      });
      return acc;
    }, {})
  };

  return insights;
}

// Generate report file for download
export async function generateReportFile(report: any) {
  // For now, generate a simple CSV file
  // In a real implementation, you might use libraries like ExcelJS for Excel files
  
  let csvContent = '';
  let fileName = '';
  
  switch (report.type) {
    case 'appointments':
      const appointmentData = await generateAppointmentReport(report.parameters);
      csvContent = generateAppointmentCSV(appointmentData);
      fileName = `appointments_report_${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'users':
      const userData = await generateUserReport(report.parameters);
      csvContent = generateUserCSV(userData);
      fileName = `users_report_${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'hubs':
      const hubData = await generateHubReport(report.parameters);
      csvContent = generateHubCSV(hubData);
      fileName = `hubs_report_${new Date().toISOString().split('T')[0]}.csv`;
      break;
    case 'capacity':
      const capacityData = await generateCapacityReport(report.parameters);
      csvContent = generateCapacityCSV(capacityData);
      fileName = `capacity_report_${new Date().toISOString().split('T')[0]}.csv`;
      break;
    default:
      csvContent = 'Report data not available';
      fileName = `report_${report._id}.csv`;
  }

  const fileBuffer = Buffer.from(csvContent, 'utf-8');
  
  return {
    fileBuffer,
    fileName,
    contentType: 'text/csv'
  };
}

// CSV generation helpers
function generateAppointmentCSV(data: any) {
  const headers = ['Date', 'Time', 'Hub', 'Student Name', 'Status', 'Notes'];
  const rows = data.appointments.map((app: any) => [
    app.appointmentDate,
    app.appointmentTime,
    app.hubName,
    `${app.userId?.firstName || ''} ${app.userId?.lastName || ''}`,
    app.status,
    app.notes || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateUserCSV(data: any) {
  const headers = ['Name', 'Email', 'Phone', 'Education Level', 'Employment Status', 'Program Interests', 'Closest Hub'];
  const rows = data.users.map((user: any) => [
    `${user.firstName} ${user.lastName}`,
    user.email,
    user.phone,
    user.educationLevel,
    user.employmentStatus,
    user.programInterests?.join('; ') || '',
    user.closestHub?.name || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateHubCSV(data: any) {
  const headers = ['Hub Name', 'Total Appointments', 'Confirmed', 'Cancelled', 'Days Off', 'Custom Slots'];
  const rows = data.hubStats.map((hub: any) => [
    hub.hubName,
    hub.totalAppointments,
    hub.confirmedAppointments,
    hub.cancelledAppointments,
    hub.daysOff,
    hub.customSlots
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateCapacityCSV(data: any) {
  const headers = ['Hub', 'Date', 'Time', 'Capacity', 'Booked', 'Utilization %', 'Active'];
  const rows = data.capacityStats.map((slot: any) => [
    slot.hubName,
    slot.date,
    slot.time,
    slot.capacity,
    slot.bookedCount,
    slot.utilizationRate.toFixed(1),
    slot.isActive ? 'Yes' : 'No'
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
} 