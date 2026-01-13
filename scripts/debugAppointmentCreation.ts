import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import models
import '../models/User';
import '../models/AppointmentOptimized';
import '../models/Hub';

const User = mongoose.models.User;
const AppointmentOptimized = mongoose.models.AppointmentOptimized;
const Hub = mongoose.models.Hub;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database:', mongoose.connection.db?.databaseName || 'Unknown');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function debugAppointments() {
  console.log('🔍 Debugging appointment creation...\n');
  
  try {
    // Check current appointments
    const currentAppointments = await AppointmentOptimized.countDocuments();
    console.log(`📅 Current appointments in database: ${currentAppointments}`);
    
    // Check test appointments specifically
    const testAppointments = await AppointmentOptimized.countDocuments({ notes: 'Test appointment - generated data' });
    console.log(`🧪 Test appointments with specific notes: ${testAppointments}`);
    
    // Check all appointments
    const allAppointments = await AppointmentOptimized.find().limit(3);
    console.log('\n📋 Sample appointments:');
    allAppointments.forEach((apt, index) => {
      console.log(`  ${index + 1}. ID: ${apt._id}, User: ${apt.userId}, Date: ${apt.date}, Status: ${apt.status}, Notes: "${apt.notes}"`);
    });
    
    // Check users
    const userCount = await User.countDocuments();
    console.log(`\n👥 Total users: ${userCount}`);
    
    const testUsers = await User.find({ email: { $regex: /@example\.com$/ } });
    console.log(`🧪 Test users (@example.com): ${testUsers.length}`);
    
    // Check hubs
    const hubCount = await Hub.countDocuments();
    console.log(`🏢 Total hubs: ${hubCount}`);
    
    // Try to create a single test appointment
    console.log('\n🔧 Attempting to create a single test appointment...');
    
    const testUser = await User.findOne({ email: 'john.doe@example.com' });
    const testHub = await Hub.findOne();
    
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    
    if (!testHub) {
      console.log('❌ No hubs found');
      return;
    }
    
    console.log(`✅ Found test user: ${testUser.firstName} ${testUser.lastName}`);
    console.log(`✅ Found test hub: ${testHub.name}`);
    
    const testAppointment = new AppointmentOptimized({
      userId: testUser._id,
      hubId: testHub._id,
      date: '2025-01-21',
      time: '10:00',
      status: 'pending',
      notes: 'Debug test appointment',
      intakeType: 'adult-education'
    });
    
    const savedAppointment = await testAppointment.save();
    console.log(`✅ Successfully created test appointment: ${savedAppointment._id}`);
    
    // Check count again
    const newCount = await AppointmentOptimized.countDocuments();
    console.log(`📊 New appointment count: ${newCount}`);
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

async function main() {
  try {
    await connectDB();
    
    console.log('🚀 Starting appointment debug...\n');
    
    await debugAppointments();
    
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
