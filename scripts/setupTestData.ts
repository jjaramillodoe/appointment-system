import dotenv from 'dotenv';
import mongoose from 'mongoose';
import '../models/User';
import '../models/Hub';
import '../models/Appointment';
import '../models/AppointmentOptimized';

// Load environment variables
dotenv.config({ path: '.env.local' });

const User = mongoose.models.User;
const Hub = mongoose.models.Hub;
const Appointment = mongoose.models.Appointment;
const AppointmentOptimized = mongoose.models.AppointmentOptimized;

/**
 * Delete all regular (non-admin) users
 */
async function deleteRegularUsers() {
  console.log('\n🗑️  Deleting all regular users...');
  const result = await User.deleteMany({ 
    $or: [
      { isAdmin: { $ne: true } },
      { isAdmin: { $exists: false } }
    ]
  });
  console.log(`   ✅ Deleted ${result.deletedCount} regular users`);
}

/**
 * Create 10 test users for a specific hub
 */
async function createTestUsersForHub(hub: any, hubIndex: number) {
  console.log(`\n👥 Creating 10 test users for ${hub.name}...`);
  const users = [];
  
  for (let i = 1; i <= 10; i++) {
    // Use hub-specific email to avoid conflicts: test1-hub1@example.com, test1-hub2@example.com, etc.
    // Format: test{number}-hub{hubNumber}@example.com
    const hubSpecificEmail = `test${i}-hub${hubIndex + 1}@example.com`; // e.g., test1-hub1@example.com, test2-hub1@example.com
    
    // Use hub-specific email to avoid conflicts across hubs
    const user = new User({
      firstName: `Test${i}`,
      lastName: `User${hubIndex}`,
      email: hubSpecificEmail,
      password: 'Test12345!', // Plain text - will be hashed by pre-save hook
      phone: `555-${String(hubIndex).padStart(3, '0')}-${String(i).padStart(4, '0')}`,
      dateOfBirth: new Date(1990 + (i % 20), i % 12, (i % 28) + 1),
      sex: i % 2 === 0 ? 'Female' : 'Male',
      preferredLanguage: ['English', 'Spanish', 'French'][i % 3],
      additionalLanguages: [],
      heardFrom: ['Google', 'Facebook', 'Friend', 'Other'][i % 4],
      barriersToLearning: ['Language', 'Literacy', 'Technology', 'Transportation'].slice(0, (i % 3) + 1),
      homeAddress: {
        street: `${i}${hubIndex} Test Street`,
        city: 'New York',
        state: 'NY',
        zipCode: `1000${i}`
      },
      address: {
        street: `${i}${hubIndex} Test Street`,
        city: 'New York',
        state: 'NY',
        zipCode: `1000${i}`
      },
      educationLevel: ['High School', 'Some College', 'Associate Degree', 'Bachelor Degree', 'Graduate Degree'][i % 5],
      employmentStatus: ['Employed', 'Unemployed', 'Student', 'Retired'][i % 4],
      employerName: i % 2 === 0 ? `Test Employer ${i}` : '',
      jobTitle: i % 2 === 0 ? `Test Job ${i}` : '',
      schoolInterest: `School ${(i % 8) + 1}`,
      programInterests: [['Adult Basic Education'], ['ESL'], ['CTE'], ['Adult Basic Education', 'ESL']][i % 4],
      emergencyContact: {
        name: `Emergency Contact ${i}`,
        relationship: ['Family', 'Friend', 'Other'][i % 3],
        phone: `555-${String(hubIndex).padStart(3, '0')}-${String(i + 100).padStart(4, '0')}`
      },
      closestHub: {
        name: hub.name,
        address: hub.location,
        latitude: 40.7128 + (hubIndex * 0.1),
        longitude: -74.0060 + (hubIndex * 0.1),
        distance: (hubIndex * 2.5) + (i * 0.3),
        distanceText: `${((hubIndex * 2.5) + (i * 0.3)).toFixed(1)} miles`
      },
      isAdmin: false,
      isSuperAdmin: false
    });
    
    try {
      await user.save();
      users.push(user);
      console.log(`   ✅ Created: ${hubSpecificEmail} (${hub.name})`);
    } catch (error: any) {
      if (error.code === 11000) {
        console.log(`   ⚠️  User ${hubSpecificEmail} already exists, skipping...`);
      } else {
        console.error(`   ❌ Error creating ${hubSpecificEmail}:`, error.message);
      }
    }
  }
  
  return users;
}

/**
 * Delete all appointments
 */
async function deleteAllAppointments() {
  console.log('\n🗑️  Deleting all appointments...');
  const result1 = await Appointment.deleteMany({});
  const result2 = await AppointmentOptimized.deleteMany({});
  console.log(`   ✅ Deleted ${result1.deletedCount} appointments (Appointment model)`);
  console.log(`   ✅ Deleted ${result2.deletedCount} appointments (AppointmentOptimized model)`);
}

/**
 * Create 10 test appointments with dates after 10/14/2026
 */
async function createTestAppointments(users: any[], hubs: any[]) {
  console.log('\n📅 Creating 10 test appointments...');
  
  const baseDate = new Date('2026-10-15'); // Start from 10/15/2026
  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const statuses: ('pending' | 'confirmed' | 'cancelled' | 'completed')[] = ['pending', 'confirmed', 'confirmed', 'pending'];
  
  // Select 10 random users from all created users
  const selectedUsers = users.sort(() => Math.random() - 0.5).slice(0, 10);
  
  for (let i = 0; i < 10; i++) {
    const user = selectedUsers[i];
    const hub = hubs.find(h => h.name === user.closestHub?.name) || hubs[i % hubs.length];
    const appointmentDate = new Date(baseDate);
    appointmentDate.setDate(baseDate.getDate() + i); // Spread appointments over 10 days
    
    const dateStr = appointmentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeSlot = timeSlots[i % timeSlots.length];
    const status = statuses[i % statuses.length];
    
    // Create AppointmentOptimized (primary model)
    try {
      const appointment = new AppointmentOptimized({
        userId: user._id,
        hubId: hub._id,
        date: dateStr,
        time: timeSlot,
        status: status,
        notes: `Test appointment ${i + 1} for ${user.firstName} ${user.lastName}`,
        adminNotes: i % 3 === 0 ? `Admin note for appointment ${i + 1}` : '',
        intakeType: 'adult-education'
      });
      
      await appointment.save();
      console.log(`   ✅ Created appointment ${i + 1}: ${user.email} - ${dateStr} ${timeSlot} (${status})`);
    } catch (error: any) {
      console.error(`   ❌ Error creating appointment ${i + 1}:`, error.message);
    }
  }
}

async function main() {
  try {
    console.log('🧹 Setting up test data...\n');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Delete all regular users
    await deleteRegularUsers();

    // Step 2: Get all active hubs
    console.log('\n📋 Fetching active hubs...');
    const hubs = await Hub.find({ isActive: true }).sort({ name: 1 });
    console.log(`   ✅ Found ${hubs.length} active hubs`);
    
    if (hubs.length === 0) {
      console.log('\n❌ No active hubs found. Please create hubs first.');
      process.exit(1);
    }

    // Step 3: Create 10 test users for each hub
    const allUsers: any[] = [];
    for (let hubIndex = 0; hubIndex < hubs.length; hubIndex++) {
      const hub = hubs[hubIndex];
      const users = await createTestUsersForHub(hub, hubIndex + 1);
      allUsers.push(...users);
    }

    // Step 4: Delete all appointments
    await deleteAllAppointments();

    // Step 5: Create 10 test appointments
    await createTestAppointments(allUsers, hubs);

    // Summary
    console.log('\n✅ Test data setup complete!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Hubs: ${hubs.length}`);
    console.log(`   - Test users created: ${allUsers.length} (10 per hub)`);
    console.log(`   - Test appointments created: 10`);
    console.log(`   - Appointment dates: After 10/14/2026`);
    console.log(`\n📧 Test user emails:`);
    hubs.forEach((hub, index) => {
      console.log(`   Hub ${index + 1} (${hub.name}):`);
      for (let i = 1; i <= 10; i++) {
        console.log(`     - test${i}-hub${index + 1}@example.com`);
      }
    });
    console.log(`\n🔑 All test users password: Test12345!`);
    
  } catch (error: any) {
    console.error('\n❌ Error setting up test data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

main();
