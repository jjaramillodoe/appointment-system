import dotenv from 'dotenv';
import mongoose from 'mongoose';
import '@/models/AppointmentOptimized';
import '@/models/User';
import '@/models/Hub';

// Load environment variables
dotenv.config({ path: '.env.local' });

const AppointmentOptimized = mongoose.models.AppointmentOptimized;
const User = mongoose.models.User;
const Hub = mongoose.models.Hub;

async function checkAppointments() {
  try {
    console.log('🔍 Checking appointments in database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB');
    
    // Count appointments
    const totalAppointments = await AppointmentOptimized.countDocuments();
    console.log(`📊 Total appointments: ${totalAppointments}`);
    
    if (totalAppointments > 0) {
      // Get sample appointments
      const sampleAppointments = await AppointmentOptimized.find()
        .populate('userId', 'firstName lastName email')
        .populate('hubId', 'name')
        .limit(5);
      
      console.log('\n📋 Sample appointments:');
      sampleAppointments.forEach((appointment, index) => {
        console.log(`${index + 1}. ${appointment.userId?.firstName} ${appointment.userId?.lastName}`);
        console.log(`   📅 Date: ${appointment.date}`);
        console.log(`   ⏰ Time: ${appointment.time}`);
        console.log(`   🏢 Hub: ${appointment.hubId?.name || 'Unknown'}`);
        console.log(`   📊 Status: ${appointment.status}`);
        console.log(`   📝 Notes: ${appointment.notes || 'No notes'}`);
        console.log('   ---');
      });
      
      // Get status breakdown
      const statusBreakdown = await AppointmentOptimized.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      console.log('\n📊 Status breakdown:');
      statusBreakdown.forEach(status => {
        console.log(`   ${status._id}: ${status.count}`);
      });
      
      // Get hub breakdown
      const hubBreakdown = await AppointmentOptimized.aggregate([
        {
          $lookup: {
            from: 'hubs',
            localField: 'hubId',
            foreignField: '_id',
            as: 'hub'
          }
        },
        {
          $addFields: {
            hubName: { $arrayElemAt: ['$hub.name', 0] }
          }
        },
        {
          $group: {
            _id: '$hubName',
            count: { $sum: 1 }
          }
        }
      ]);
      
      console.log('\n🏢 Hub breakdown:');
      hubBreakdown.forEach(hub => {
        console.log(`   ${hub._id || 'Unknown'}: ${hub.count}`);
      });
    }
    
    console.log('\n✅ Check complete!');
    
  } catch (error) {
    console.error('❌ Error checking appointments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkAppointments();
