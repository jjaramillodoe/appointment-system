import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestUsers() {
  console.log('👥 Creating test users...');
  
  // Create a few test users with all required fields
  const testUsers = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: await bcrypt.hash('Welcome123!', 10),
      phone: '555-111-1111',
      dateOfBirth: new Date('1990-01-15'),
      sex: 'Male',
      preferredLanguage: 'English',
      additionalLanguages: [],
      heardFrom: 'Google',
      barriersToLearning: ['Technology'],
      homeAddress: {
        street: '123 Main St',
        city: 'Springfield',
        state: 'CA',
        zipCode: '12345'
      },
      address: {
        street: '123 Main St',
        city: 'Springfield',
        state: 'CA',
        zipCode: '12345'
      },
      educationLevel: 'High School',
      employmentStatus: 'Employed',
      employerName: 'Tech Corp',
      jobTitle: 'Developer',
      schoolInterest: 'School 1',
      programInterests: ['CTE'],
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '555-111-1112'
      },
      isAdmin: false
    },
    {
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria.garcia@example.com',
      password: await bcrypt.hash('Welcome123!', 10),
      phone: '555-222-2222',
      dateOfBirth: new Date('1985-06-20'),
      sex: 'Female',
      preferredLanguage: 'Spanish',
      additionalLanguages: ['English'],
      heardFrom: 'Friend',
      barriersToLearning: ['Language', 'Transportation'],
      homeAddress: {
        street: '456 Oak Ave',
        city: 'Riverside',
        state: 'CA',
        zipCode: '23456'
      },
      address: {
        street: '456 Oak Ave',
        city: 'Riverside',
        state: 'CA',
        zipCode: '23456'
      },
      educationLevel: 'Some College',
      employmentStatus: 'Unemployed',
      employerName: '',
      jobTitle: '',
      schoolInterest: 'School 2',
      programInterests: ['ESL', 'Adult Basic Education'],
      emergencyContact: {
        name: 'Carlos Garcia',
        relationship: 'Parent',
        phone: '555-222-2223'
      },
      isAdmin: false
    },
    {
      firstName: 'David',
      lastName: 'Chen',
      email: 'david.chen@example.com',
      password: await bcrypt.hash('Welcome123!', 10),
      phone: '555-333-3333',
      dateOfBirth: new Date('1995-12-10'),
      sex: 'Male',
      preferredLanguage: 'English',
      additionalLanguages: ['French'],
      heardFrom: 'Facebook',
      barriersToLearning: ['Technology', 'Literacy'],
      homeAddress: {
        street: '789 Pine Rd',
        city: 'Fairview',
        state: 'CA',
        zipCode: '34567'
      },
      address: {
        street: '789 Pine Rd',
        city: 'Fairview',
        state: 'CA',
        zipCode: '34567'
      },
      educationLevel: 'Associate Degree',
      employmentStatus: 'Student',
      employerName: '',
      jobTitle: '',
      schoolInterest: 'School 3',
      programInterests: ['CTE', 'Adult Basic Education'],
      emergencyContact: {
        name: 'Li Chen',
        relationship: 'Sibling',
        phone: '555-333-3334'
      },
      isAdmin: false
    }
  ];

  try {
    // Clear existing test users
    await User.deleteMany({ email: { $in: testUsers.map(u => u.email) } });
    
    // Create users
    const createdUsers = await User.insertMany(testUsers);
    console.log(`✅ Created ${createdUsers.length} test users`);
    
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    return [];
  }
}

async function createTestAppointments(users: any[]) {
  console.log('📅 Creating test appointments...');
  
  // Get all hubs
  const hubs = await Hub.find();
  if (hubs.length === 0) {
    console.log('⚠️  No hubs found. Please create hubs first.');
    return;
  }
  
  const appointments = [];
  const today = new Date();
  
  // Create appointments for each user across different dates
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    
    // Past appointments (completed/cancelled)
    for (let dayOffset = -7; dayOffset < 0; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      
      const appointment = new AppointmentOptimized({
        userId: user._id,
        hubId: hubs[Math.floor(Math.random() * hubs.length)]._id,
        date: dateStr,
        time: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'][Math.floor(Math.random() * 6)],
        status: Math.random() > 0.3 ? 'completed' : 'cancelled',
        notes: 'Test appointment - generated data',
        intakeType: 'adult-education'
      });
      
      appointments.push(appointment);
    }
    
    // Today and future appointments (pending/confirmed)
    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      
      const appointment = new AppointmentOptimized({
        userId: user._id,
        hubId: hubs[Math.floor(Math.random() * hubs.length)]._id,
        date: dateStr,
        time: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00'][Math.floor(Math.random() * 6)],
        status: Math.random() > 0.5 ? 'confirmed' : 'pending',
        notes: 'Test appointment - generated data',
        intakeType: 'adult-education'
      });
      
      appointments.push(appointment);
    }
  }
  
  try {
    // Clear existing test appointments
    await AppointmentOptimized.deleteMany({ notes: 'Test appointment - generated data' });
    
    // Create appointments
    const createdAppointments = await AppointmentOptimized.insertMany(appointments);
    console.log(`✅ Created ${createdAppointments.length} test appointments`);
    
    return createdAppointments;
  } catch (error) {
    console.error('❌ Error creating appointments:', error);
    return [];
  }
}

async function main() {
  try {
    await connectDB();
    
    console.log('🚀 Starting simple test data generation...\n');
    
    // Create users first
    const users = await createTestUsers();
    if (users.length === 0) {
      console.log('❌ Failed to create users. Exiting.');
      return;
    }
    
    // Create appointments
    const appointments = await createTestAppointments(users);
    if (!appointments) {
      console.log('❌ Failed to create appointments. Exiting.');
      return;
    }
    
    console.log('\n🎉 Test data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Users created: ${users.length}`);
    console.log(`   • Appointments created: ${appointments.length}`);
    console.log('\n🔑 Test Accounts:');
    console.log('   • john.doe@example.com / Welcome123!');
    console.log('   • maria.garcia@example.com / Welcome123!');
    console.log('   • david.chen@example.com / Welcome123!');
    console.log('\n📅 Appointments span: Last 7 days to next 7 days');
    console.log('   • Past dates: Mostly completed/cancelled');
    console.log('   • Today & Future: Mix of confirmed/pending');
    
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
