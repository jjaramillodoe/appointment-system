import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import models
import '../models/Notification';
import '../models/User';
import '../models/AppointmentOptimized';
import '../models/Hub';

const Notification = mongoose.models.Notification;
const User = mongoose.models.User;
const AppointmentOptimized = mongoose.models.AppointmentOptimized;
const Hub = mongoose.models.Hub;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestNotifications() {
  console.log('🔔 Creating test notifications...');
  
  try {
    // Get some users and hubs for reference
    const users = await User.find().limit(3);
    const hubs = await Hub.find().limit(3);
    const appointments = await AppointmentOptimized.find().limit(3);
    
    if (users.length === 0 || hubs.length === 0) {
      console.log('⚠️  Need users and hubs to create notifications');
      return;
    }
    
    // Clear existing test notifications
    await Notification.deleteMany({ message: { $regex: /^Test notification/ } });
    
    const notifications = [
      {
        type: 'low_capacity',
        title: 'Low Capacity Alert',
        message: 'Test notification - Hub capacity is running low for tomorrow',
        hubName: hubs[0]?.name || 'Test Hub',
        read: false,
        createdAt: new Date()
      },
      {
        type: 'no_show',
        title: 'No-Show Detected',
        message: 'Test notification - User missed their appointment today',
        userId: users[0]?._id,
        appointmentId: appointments[0]?._id,
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        type: 'reminder',
        title: 'Appointment Reminder',
        message: 'Test notification - Sending reminder for upcoming appointment',
        userId: users[1]?._id,
        appointmentId: appointments[1]?._id,
        read: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        type: 'system',
        title: 'System Maintenance',
        message: 'Test notification - Scheduled maintenance this weekend',
        read: false,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      },
      {
        type: 'appointment',
        title: 'New Appointment',
        message: 'Test notification - New appointment scheduled for next week',
        userId: users[2]?._id,
        appointmentId: appointments[2]?._id,
        read: true,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      }
    ];
    
    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`✅ Created ${createdNotifications.length} test notifications`);
    
    return createdNotifications;
  } catch (error) {
    console.error('❌ Error creating notifications:', error);
    return [];
  }
}

async function main() {
  try {
    await connectDB();
    
    console.log('🚀 Starting test notification generation...\n');
    
    const notifications = await createTestNotifications();
    if (!notifications) {
      console.log('❌ Failed to create notifications. Exiting.');
      return;
    }
    
    console.log('\n🎉 Test notification generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Notifications created: ${notifications.length}`);
    console.log('\n🔔 Notification Types:');
    console.log('   • Low Capacity Alert (unread)');
    console.log('   • No-Show Detected (unread)');
    console.log('   • Appointment Reminder (read)');
    console.log('   • System Maintenance (unread)');
    console.log('   • New Appointment (read)');
    
  } catch (error) {
    console.error('❌ Error in main:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  main();
}
