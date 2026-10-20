'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

// Import our new dashboard components
import {
  DashboardHeader,
  TabNavigation,
  StatsCards,
  PersonalInfoCard,
  AppointmentPrintCard,
  ProfileTab,
  AppointmentsTab,
  AppointmentCard,
  ScheduleAppointmentModal,
  AddressEditModal,
  ProfileCompletionBanner,
  PendingProfileBanner,
  type TabType,
  type User,
  type Appointment,
  type ScheduleForm
} from '@/components/dashboard';
import { DASHBOARD_CONTENT_CLASS } from '@/components/dashboard/shell';
import { calculateProfileCompletion } from '@/lib/profileCompletion';
import { APPOINTMENT_STATUS, isPendingProfile } from '@/lib/appointmentStatus';
import { toAppointmentClock } from '@/lib/appointmentTime';
import { useI18n } from '@/contexts/I18nContext';

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

// Utility to handle various date formats
function parseToLocalDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  if (typeof dateValue === 'string') {
    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      const [year, month, day] = dateValue.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // ISO string (UTC)
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      // If time is 00:00:00Z, treat as UTC and construct local date from UTC parts
      if (dateValue.endsWith('T00:00:00.000Z')) {
        const year = d.getUTCFullYear();
        const month = d.getUTCMonth();
        const day = d.getUTCDate();
        return new Date(year, month, day);
      }
      return d;
    }
  }
  if (typeof dateValue === 'object' && dateValue.$date) {
    const d = new Date(dateValue.$date);
    if (!isNaN(d.getTime())) {
      // If time is 00:00:00Z, treat as UTC and construct local date from UTC parts
      if (dateValue.$date.endsWith('T00:00:00.000Z')) {
        const year = d.getUTCFullYear();
        const month = d.getUTCMonth();
        const day = d.getUTCDate();
        return new Date(year, month, day);
      }
      return d;
    }
  }
  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { toasts, showSuccess, showError, showInfo, removeToast } = useToast();
  const { user: authUser, token, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const msg = t.dashboard.page;
  const [user, setUser] = useState<User | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [appointmentHistory, setAppointmentHistory] = useState<Appointment[]>([]);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tab management
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'profile' || tab === 'appointments' || tab === 'dashboard') {
      setActiveTab(tab);
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);
  
  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    sex: '',
    preferredLanguage: '',
    additionalLanguages: [] as string[],
    heardFrom: '',
    barriersToLearning: [] as string[],
    homeAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    educationLevel: '',
    employmentStatus: '',
    employerName: '',
    jobTitle: '',
    schoolInterest: '',
    programInterests: [] as string[],
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Appointment scheduling
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>({
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
    selectedHub: '',
  });
  const [isScheduling, setIsScheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');
  const [calendarValue, setCalendarValue] = useState<Value>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isDayOff, setIsDayOff] = useState(false);
  const [dayOffReason, setDayOffReason] = useState('');
  const [hubConfigs, setHubConfigs] = useState<any[]>([]);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfirmationSuccess, setShowConfirmationSuccess] = useState(false);

  // Helper function to format time with improved error handling
  const formatTime = (time: string | undefined): string => {
    if (!time) return t.dashboard.common.timeNotAvailable;
    
    try {
      // Handle various time formats
      const timeStr = time.toString();
      
      // If it's already in 12-hour format, return as-is
      if (timeStr.includes('AM') || timeStr.includes('PM')) {
        return timeStr;
      }
      
      // If it's in 24-hour format (HH:MM), convert to 12-hour
      if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        const [hourStr, minute] = timeStr.split(':');
        const hour = parseInt(hourStr, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minute} ${period}`;
      }
      
      return timeStr;
    } catch (error) {
      logger.warn('Error formatting time:', time, error);
      return t.dashboard.common.timeNotAvailable;
    }
  };

  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12h: string): string => {
    try {
      if (!time12h.includes('AM') && !time12h.includes('PM')) {
        return time12h; // Already in 24-hour format
      }
      
      const [time, period] = time12h.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours, 10);
      
      if (period.toUpperCase() === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period.toUpperCase() === 'AM' && hour === 12) {
        hour = 0;
      }
      
      return `${hour.toString().padStart(2, '0')}:${minutes}`;
    } catch (error) {
      logger.warn('Error converting time to 24-hour format:', time12h, error);
      return time12h;
    }
  };

  // Load user data and fetch appointment on component mount
  useEffect(() => {
    // Use AuthContext instead of localStorage
    if (authLoading) return; // Wait for auth to load

    if (!token || !authUser) {
      router.push('/login');
      return;
    }

    setUser(authUser);

    fetch('/api/appointments', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        setAppointment(data.appointment || null);
        setAppointmentHistory(data.history || []);
      })
      .catch(error => {
        logger.error('❌ Error fetching appointment:', error);
        setAppointment(null);
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [authLoading, token, authUser, router]);

  // Populate profile form when user data is available
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? (new Date(user.dateOfBirth)).toISOString().split('T')[0] : '',
        sex: user.sex || '',
        preferredLanguage: user.preferredLanguage || '',
        additionalLanguages: user.additionalLanguages || [],
        heardFrom: user.heardFrom || '',
        barriersToLearning: user.barriersToLearning || [],
        homeAddress: {
          street: user.homeAddress?.street || user.address?.street || '',
          city: user.homeAddress?.city || user.address?.city || '',
          state: user.homeAddress?.state || user.address?.state || '',
          zipCode: user.homeAddress?.zipCode || user.address?.zipCode || ''
        },
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || ''
        },
        educationLevel: user.educationLevel || '',
        employmentStatus: user.employmentStatus || '',
        employerName: user.employerName || '',
        jobTitle: user.jobTitle || '',
        schoolInterest: user.schoolInterest || '',
        programInterests: user.programInterests || [],
        emergencyContact: {
          name: user.emergencyContact?.name || '',
          relationship: user.emergencyContact?.relationship || '',
          phone: user.emergencyContact?.phone || ''
        }
      });

      // Initialize address form for editing
      if (user.address) {
        setAddressForm({
          street: user.address.street || '',
          city: user.address.city || '',
          state: user.address.state || '',
          zipCode: user.address.zipCode || ''
        });
      }
    }
  }, [user]);

  // Student dashboard uses the public hubs list, not the admin API.
  useEffect(() => {
    fetch('/api/hubs')
      .then(res => res.json())
      .then(data => {
        const hubs = Array.isArray(data) ? data : data.hubs;
        if (!Array.isArray(hubs)) {
          throw new Error(data.error || msg.loadHubsFailed);
        }

        setHubConfigs(hubs.map((hub: any) => ({
          hubName: hub.name,
          _id: hub._id,
          defaultSlots: hub.defaultSlots || [],
          daysOff: [],
          customSlots: {}
        })));
      })
      .catch(error => logger.error('Error fetching hubs:', error));
  }, []);

  // Update available slots when hub or date changes - Updated to use optimized API
  useEffect(() => {
    if (!scheduleForm.selectedHub || !scheduleForm.appointmentDate) {
      setAvailableSlots([]);
      setIsDayOff(false);
      setDayOffReason('');
      return;
    }

    const fetchOptimizedAvailability = async () => {
      try {
        // Find hub ID from hub name
        const selectedHubConfig = hubConfigs.find(cfg => cfg.hubName === scheduleForm.selectedHub);
        if (!selectedHubConfig?._id) {
          logger.warn('Hub ID not found for:', scheduleForm.selectedHub);
          return;
        }

        const response = await fetch(`/api/availability?hubId=${selectedHubConfig._id}&date=${scheduleForm.appointmentDate}`);
        if (response.ok) {
          const data = await response.json();

          if (data.success && data.data) {
            setIsDayOff(data.data.isDayOff);
            setDayOffReason(data.data.dayOffReason || '');
            if (data.data.isDayOff) {
              setAvailableSlots([]);
            } else {
              // Convert slots to time strings and filter available ones
              const currentClock = toAppointmentClock(scheduleForm.appointmentTime);
              const availableTimes = data.data.slots
                .filter((slot: any) => (
                  slot.available > 0
                  || (isRescheduling && toAppointmentClock(slot.time) === currentClock)
                ))
                .map((slot: any) => toAppointmentClock(slot.time));
              setAvailableSlots(availableTimes);
            }
          }
        } else {
          logger.error('Failed to fetch optimized availability:', response.status);
        }
      } catch (error) {
        logger.error('Error fetching optimized availability:', error);
      }
    };

    fetchOptimizedAvailability();
  }, [scheduleForm.selectedHub, scheduleForm.appointmentDate, scheduleForm.appointmentTime, hubConfigs, isRescheduling]);

  // Update selectedHub when user data is loaded or when schedule form is opened
  useEffect(() => {
    if (isRescheduling) return;
    if (user?.closestHub?.name && (!scheduleForm.selectedHub || showScheduleForm)) {
      setScheduleForm(prev => ({
        ...prev,
        selectedHub: user.closestHub!.name
      }));
    }
  }, [user, scheduleForm.selectedHub, showScheduleForm, isRescheduling]);

  const openReschedule = () => {
    if (appointment) {
      const d = parseToLocalDate(appointment.appointmentDate);
      setScheduleForm({
        appointmentDate: d ? format(d, 'yyyy-MM-dd') : '',
        appointmentTime: appointment.appointmentTime || '',
        notes: appointment.notes || '',
        selectedHub: appointment.hubName || user?.closestHub?.name || '',
      });
    }
    setIsRescheduling(true);
    setShowScheduleForm(true);
  };

  // Event Handlers
  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduling(true);
    setError('');

    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      setError(msg.authRequired);
      setIsScheduling(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);

      const selectedHubConfig = hubConfigs.find(cfg => cfg.hubName === scheduleForm.selectedHub);
      
      if (!selectedHubConfig?._id) {
        throw new Error(msg.hubNotFound);
      }

      // Convert 12-hour time to 24-hour format for backend
      const time24h = convertTo24Hour(scheduleForm.appointmentTime);

      const bookingData = {
        action: 'book',
        hubId: selectedHubConfig._id,
        date: scheduleForm.appointmentDate,
        time: time24h,
        userId: parsedUser.id || parsedUser._id,
        notes: scheduleForm.notes,
        intakeType: 'adult-education'
      };

      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (String(data.error || '').toLowerCase().includes('fully booked') || response.status === 409) {
          const join = window.confirm(msg.windowFullConfirm);
          if (join) {
            await fetch('/api/waitlist', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ hubId: selectedHubConfig._id }),
            });
            showSuccess(msg.waitlistJoined);
            setShowScheduleForm(false);
            return;
          }
        }
        throw new Error(data.error || msg.scheduleFailed);
      }

      if (!data.success) {
        throw new Error(data.error || msg.scheduleFailed);
      }

      // Update local appointment state with proper typing
      const newAppointment: Appointment = {
        _id: data.appointmentId || 'temp-id',
        appointmentDate: scheduleForm.appointmentDate,
        appointmentTime: scheduleForm.appointmentTime,
        status: (data.status || APPOINTMENT_STATUS.CONFIRMED) as Appointment['status'],
        notes: scheduleForm.notes,
        intakeType: 'adult-education',
        hubName: scheduleForm.selectedHub
      };

      setAppointment(newAppointment);
      setShowScheduleForm(false);
      setScheduleForm({ appointmentDate: '', appointmentTime: '', notes: '', selectedHub: user?.closestHub?.name || '' });
      
      // Show success message
      setError('');
      showSuccess(msg.scheduled);

    } catch (err: any) {
      logger.error('❌ Booking error:', err);
      setError(err.message || msg.scheduleFailed);
      showError(err.message || msg.scheduleFailed);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!window.confirm(msg.cancelConfirm)) return;
    setIsCancelling(true);
    setError('');

    const token = localStorage.getItem('token');
    
    if (!token) {
      showError(msg.authRequired);
      setIsCancelling(false);
      return;
    }

    try {
      // Use the student appointments DELETE endpoint
      const response = await fetch('/api/appointments', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || msg.cancelFailed);
      }

      setAppointment(null);

      // Show success toast
      setError('');
      showSuccess(msg.cancelled, 6000);

    } catch (err: any) {
      setError(err.message || msg.cancelFailed);
      showError(err.message || msg.cancelFailed);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleConfirmAppointment = async () => {
    setIsConfirming(true);
    setError('');

    try {
      const authToken = token || localStorage.getItem('token');
      const response = await fetch('/api/appointments/confirm', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || msg.confirmFailed);
      if (appointment) {
        setAppointment({ ...appointment, status: 'confirmed' });
      }
      setShowConfirmationSuccess(true);
      setTimeout(() => setShowConfirmationSuccess(false), 5000);
      showSuccess(msg.confirmed);
    } catch (err: any) {
      setError(err.message || msg.confirmFailed);
      showError(err.message || msg.confirmFailed);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRescheduleAppointment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isRescheduling) {
      await handleScheduleAppointment(event);
      return;
    }

    setIsScheduling(true);
    setError('');
    try {
      const selectedHubConfig = hubConfigs.find((cfg) => cfg.hubName === scheduleForm.selectedHub);
      if (!selectedHubConfig?._id) throw new Error(msg.hubNotFound);
      const authToken = token || localStorage.getItem('token');
      const response = await fetch('/api/appointments/reschedule', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          hubId: selectedHubConfig._id,
          date: scheduleForm.appointmentDate,
          time: scheduleForm.appointmentTime,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || msg.rescheduleFailed);
      setAppointment({
        ...(appointment as Appointment),
        appointmentDate: scheduleForm.appointmentDate,
        appointmentTime: scheduleForm.appointmentTime,
        hubName: scheduleForm.selectedHub,
      });
      setShowScheduleForm(false);
      setIsRescheduling(false);
      showSuccess(msg.rescheduled);
    } catch (err: any) {
      setError(err.message || msg.rescheduleFailed);
      showError(err.message || msg.rescheduleFailed);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleUpdateAddress = async (addressData: typeof addressForm) => {
    setIsUpdatingAddress(true);
    setError('');

    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/auth/update-address', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(addressData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || msg.addressFailed);
      }

      // Update local user data
      const updatedUser = { ...user, ...data.user };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setIsEditingAddress(false);
      setAddressForm({
        street: '',
        city: '',
        state: '',
        zipCode: ''
      });
      showSuccess(msg.addressUpdated);
    } catch (err: any) {
      setError(err.message || msg.addressFailed);
      showError(err.message || msg.addressFailed);
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  const handleSaveProfile = async (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    if (token) {
      try {
        const response = await fetch('/api/appointments', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setAppointment(data.appointment || null);
      } catch (error) {
        logger.error('Error refreshing appointment after profile update:', error);
      }
    }
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    // Reset form to current user data
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? (new Date(user.dateOfBirth)).toISOString().split('T')[0] : '',
        sex: user.sex || '',
        preferredLanguage: user.preferredLanguage || '',
        additionalLanguages: user.additionalLanguages || [],
        heardFrom: user.heardFrom || '',
        barriersToLearning: user.barriersToLearning || [],
        homeAddress: {
          street: user.homeAddress?.street || user.address?.street || '',
          city: user.homeAddress?.city || user.address?.city || '',
          state: user.homeAddress?.state || user.address?.state || '',
          zipCode: user.homeAddress?.zipCode || user.address?.zipCode || ''
        },
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || ''
        },
        educationLevel: user.educationLevel || '',
        employmentStatus: user.employmentStatus || '',
        employerName: user.employerName || '',
        jobTitle: user.jobTitle || '',
        schoolInterest: user.schoolInterest || '',
        programInterests: user.programInterests || [],
        emergencyContact: {
          name: user.emergencyContact?.name || '',
          relationship: user.emergencyContact?.relationship || '',
          phone: user.emergencyContact?.phone || ''
        }
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600" role="status">{msg.loading}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">{msg.loginRequired}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader user={user} />

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className={`${DASHBOARD_CONTENT_CLASS} py-8`}>
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {isPendingProfile(appointment?.status) && (
              <PendingProfileBanner
                appointmentDate={appointment?.appointmentDate}
                appointmentTime={appointment?.appointmentTime}
                parseToLocalDate={parseToLocalDate}
                formatTime={formatTime}
                onCompleteProfile={() => setActiveTab('profile')}
              />
            )}

            {user && (
              <ProfileCompletionBanner
                completionPercentage={calculateProfileCompletion(user).percentage}
                onNavigateToProfile={() => setActiveTab('profile')}
              />
            )}

            {/* Stats Cards */}
            <StatsCards
              user={user}
              appointment={appointment}
              parseToLocalDate={parseToLocalDate}
              appointmentHubName={appointment?.hubName}
            />

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Personal Info */}
              <div className="lg:col-span-1 space-y-8">
                <PersonalInfoCard 
                  user={user} 
                  onEditAddress={() => setIsEditingAddress(true)} 
                />
                {appointment && (
                  <AppointmentPrintCard
                    appointment={appointment}
                    user={user}
                    parseToLocalDate={parseToLocalDate}
                    formatTime={formatTime}
                  />
                )}
              </div>

              {/* Right Column - Appointment */}
              <div className="lg:col-span-2">
                <AppointmentCard
                  appointment={appointment}
                  user={user}
                  onScheduleClick={() => setShowScheduleForm(true)}
                  onConfirm={handleConfirmAppointment}
                  onCompleteProfile={() => setActiveTab('profile')}
                  onCancel={handleCancelAppointment}
                  onReschedule={openReschedule}
                  isConfirming={isConfirming}
                  isCancelling={isCancelling}
                  error={error}
                  showConfirmationSuccess={showConfirmationSuccess}
                  parseToLocalDate={parseToLocalDate}
                  formatTime={formatTime}
                  scheduleForm={scheduleForm}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            user={user}
            onProfileUpdate={handleSaveProfile}
            showSuccess={showSuccess}
            showError={showError}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsTab
            appointment={appointment}
            history={appointmentHistory}
            onScheduleClick={() => setShowScheduleForm(true)}
            onReschedule={openReschedule}
            onConfirm={handleConfirmAppointment}
            onCancel={handleCancelAppointment}
            isConfirming={isConfirming}
            isCancelling={isCancelling}
            error={error}
            parseToLocalDate={parseToLocalDate}
            formatTime={formatTime}
            showScheduleForm={showScheduleForm}
            scheduleForm={scheduleForm}
            setScheduleForm={setScheduleForm}
            onSubmitSchedule={handleRescheduleAppointment}
            onCloseSchedule={() => {
              setShowScheduleForm(false);
              setIsRescheduling(false);
            }}
            isScheduling={isScheduling}
            isDayOff={isDayOff}
            dayOffReason={dayOffReason}
            availableSlots={availableSlots}
            hubConfigs={hubConfigs}
            user={user}
          />
        )}
      </main>

      {/* Modals */}
      <ScheduleAppointmentModal
        isOpen={showScheduleForm}
        onClose={() => {
          setShowScheduleForm(false);
          setIsRescheduling(false);
        }}
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        onSubmit={handleRescheduleAppointment}
        isScheduling={isScheduling}
        error={error}
        isDayOff={isDayOff}
        dayOffReason={dayOffReason}
        availableSlots={availableSlots}
        user={user}
        hubConfigs={hubConfigs}
        isRescheduling={isRescheduling}
      />

      <AddressEditModal
        isOpen={isEditingAddress}
        onClose={() => setIsEditingAddress(false)}
        onSubmit={handleUpdateAddress}
        user={user}
        isUpdating={isUpdatingAddress}
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
} 