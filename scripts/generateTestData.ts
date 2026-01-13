import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Import models
import '../models/User';
import '../models/AppointmentOptimized';
import '../models/Hub';
import '../models/HubConfig';

const User = mongoose.models.User;
const AppointmentOptimized = mongoose.models.AppointmentOptimized;
const Hub = mongoose.models.Hub;
const HubConfig = mongoose.models.HubConfig;

// Test data arrays
const educationLevels = ['High School', 'Some College', 'Associate Degree', 'Bachelor Degree', 'Graduate Degree', 'Other'];
const programInterests = ['Adult Basic Education', 'ESL', 'CTE'];
const barriersToLearning = ['Language', 'Literacy', 'Technology', 'Transportation', 'Other'];
const appointmentTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
const appointmentStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];

// Additional required fields
const sexes = ['Male', 'Female', 'Other'];
const preferredLanguages = ['English', 'Spanish', 'French', 'Other'];
const heardFromOptions = ['Google', 'Facebook', 'Friend', 'Other'];
const employmentStatuses = ['Employed', 'Unemployed', 'Student', 'Retired', 'Other'];
const schoolInterests = ['School 1', 'School 2', 'School 3', 'School 4', 'School 5', 'School 6', 'School 7', 'School 8'];
const relationships = ['Spouse', 'Parent', 'Sibling', 'Friend', 'Other'];

// Sample names for variety
const firstNames = [
  'Alice', 'Bob', 'Carlos', 'Diana', 'Elena', 'Frank', 'Grace', 'Henry',
  'Isabella', 'James', 'Karen', 'Luis', 'Maria', 'Nathan', 'Olivia', 'Paul',
  'Quinn', 'Rachel', 'Samuel', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier'
];

const lastNames = [
  'Anderson', 'Brown', 'Chen', 'Davis', 'Evans', 'Fisher', 'Garcia', 'Harris',
  'Johnson', 'Kim', 'Lee', 'Martinez', 'Nguyen', 'O\'Connor', 'Patel', 'Quinn',
  'Rodriguez', 'Smith', 'Taylor', 'Ullman', 'Vargas', 'Williams', 'Xu', 'Young'
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function generateUsers() {
  console.log('👥 Generating test users...');
  
  const users = [];
  
  for (let i = 0; i < 25; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const email = `testuser${i + 1}@example.com`;
    
    // Hash password
    const hashedPassword = await bcrypt.hash('Welcome123!', 10);
    
    // Randomly select education level, program interests, and barriers
    const educationLevel = educationLevels[Math.floor(Math.random() * educationLevels.length)];
    const numPrograms = Math.floor(Math.random() * 3) + 1; // 1-3 programs
    const numBarriers = Math.floor(Math.random() * 3) + 1; // 1-3 barriers
    
    const programInterestsList = [];
    const barriersList = [];
    
    // Randomly select program interests
    const shuffledPrograms = [...programInterests].sort(() => 0.5 - Math.random());
    for (let j = 0; j < numPrograms; j++) {
      programInterestsList.push(shuffledPrograms[j]);
    }
    
    // Randomly select barriers
    const shuffledBarriers = [...barriersToLearning].sort(() => 0.5 - Math.random());
    for (let j = 0; j < numBarriers; j++) {
      barriersList.push(shuffledBarriers[j]);
    }
    
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone: `555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      dateOfBirth: new Date(1980 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      sex: sexes[Math.floor(Math.random() * sexes.length)],
      preferredLanguage: preferredLanguages[Math.floor(Math.random() * preferredLanguages.length)],
      additionalLanguages: [],
      heardFrom: heardFromOptions[Math.floor(Math.random() * heardFromOptions.length)],
      barriersToLearning: barriersList,
      homeAddress: {
        street: `${Math.floor(Math.random() * 9999) + 1} ${['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Cedar Ln'][Math.floor(Math.random() * 5)]}`,
        city: ['Springfield', 'Riverside', 'Fairview', 'Greenfield', 'Lakeside'][Math.floor(Math.random() * 5)],
        state: 'CA',
        zipCode: `${Math.floor(Math.random() * 90000) + 10000}`
      },
      address: {
        street: `${Math.floor(Math.random() * 9999) + 1} ${['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Cedar Ln'][Math.floor(Math.random() * 5)]}`,
        city: ['Springfield', 'Riverside', 'Fairview', 'Greenfield', 'Lakeside'][Math.floor(Math.random() * 5)],
        state: 'CA',
        zipCode: `${Math.floor(Math.random() * 90000) + 10000}`
      },
      educationLevel,
      employmentStatus: employmentStatuses[Math.floor(Math.random() * employmentStatuses.length)],
      employerName: Math.random() > 0.5 ? `Company ${Math.floor(Math.random() * 100) + 1}` : '',
      jobTitle: Math.random() > 0.5 ? ['Manager', 'Developer', 'Teacher', 'Sales', 'Admin'][Math.floor(Math.random() * 5)] : '',
      schoolInterest: schoolInterests[Math.floor(Math.random() * schoolInterests.length)],
      programInterests: programInterestsList,
      emergencyContact: {
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        relationship: relationships[Math.floor(Math.random() * relationships.length)],
        phone: `555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      },
      isAdmin: false
    });
    
    users.push(user);
  }
  
  // Create one admin user
  const adminUser = new User({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: await bcrypt.hash('Welcome123!', 10),
    phone: '555-000-0000',
    dateOfBirth: new Date(1985, 5, 15),
    sex: 'Male',
    preferredLanguage: 'English',
    additionalLanguages: [],
    heardFrom: 'Google',
    barriersToLearning: ['Technology'],
    homeAddress: {
      street: '123 Admin St',
      city: 'Admin City',
      state: 'CA',
      zipCode: '12345'
    },
    address: {
      street: '123 Admin St',
      city: 'Admin City',
      state: 'CA',
      zipCode: '12345'
    },
    educationLevel: 'Graduate Degree',
    employmentStatus: 'Employed',
    employerName: 'Admin Corp',
    jobTitle: 'System Administrator',
    schoolInterest: 'School 1',
    programInterests: ['CTE'],
    emergencyContact: {
      name: 'Jane Admin',
      relationship: 'Spouse',
      phone: '555-000-0001'
    },
    isAdmin: true
  });
  
  users.push(adminUser);
  
  try {
    // Clear existing users first
    await User.deleteMany({ email: { $regex: /^testuser/ } });
    await User.deleteMany({ email: 'admin@example.com' });
    
    // Insert new users
    const savedUsers = await User.insertMany(users);
    console.log(`✅ Created ${savedUsers.length} users`);
    
    return savedUsers;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    return [];
  }
}

async function generateAppointments(users: any[]) {
  console.log('📅 Generating test appointments...');
  
  // Get all hubs
  const hubs = await Hub.find();
  if (hubs.length === 0) {
    console.log('⚠️  No hubs found. Please create hubs first.');
    return;
  }
  
  const appointments = [];
  const regularUsers = users.filter(user => !user.isAdmin);
  
  // Generate appointments for the last 30 days and next 30 days
  for (let dayOffset = -30; dayOffset <= 30; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate 1-3 appointments per day (more realistic)
    const numAppointments = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numAppointments; i++) {
      const user = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      const hub = hubs[Math.floor(Math.random() * hubs.length)];
      const time = appointmentTimes[Math.floor(Math.random() * appointmentTimes.length)];
      
      // Determine status based on date
      let status: string;
      if (dayOffset < 0) {
        // Past dates - mostly completed, some cancelled
        status = Math.random() > 0.2 ? 'completed' : 'cancelled';
      } else if (dayOffset === 0) {
        // Today - mix of confirmed and pending
        status = Math.random() > 0.5 ? 'confirmed' : 'pending';
      } else if (dayOffset <= 7) {
        // Next week - mostly confirmed, some pending
        status = Math.random() > 0.3 ? 'confirmed' : 'pending';
      } else {
        // Future dates - mostly pending, some confirmed
        status = Math.random() > 0.7 ? 'confirmed' : 'pending';
      }
      
      const appointment = new AppointmentOptimized({
        userId: user._id,
        hubId: hub._id,
        date: dateStr,
        time,
        status,
        notes: status === 'cancelled' ? 'Test appointment - cancelled' : 'Test appointment',
        intakeType: 'adult-education',
        createdAt: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000), // Random time during the day
        updatedAt: new Date()
      });
      
      appointments.push(appointment);
    }
  }
  
  try {
    // Clear existing test appointments
    await AppointmentOptimized.deleteMany({ notes: { $regex: /^Test appointment/ } });
    
    // Insert new appointments
    const savedAppointments = await AppointmentOptimized.insertMany(appointments);
    console.log(`✅ Created ${savedAppointments.length} appointments`);
    
    return savedAppointments;
  } catch (error) {
    console.error('❌ Error creating appointments:', error);
    return [];
  }
}

async function main() {
  try {
    await connectDB();
    
    console.log('🚀 Starting test data generation...\n');
    
    // Generate users first
    const users = await generateUsers();
    if (users.length === 0) {
      console.log('❌ Failed to create users. Exiting.');
      return;
    }
    
    // Generate appointments
    const appointments = await generateAppointments(users);
    if (!appointments) {
      console.log('❌ Failed to create appointments. Exiting.');
      return;
    }
    
    console.log('\n🎉 Test data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • Users created: ${users.length}`);
    console.log(`   • Appointments created: ${appointments.length}`);
    console.log('\n🔑 Test Accounts:');
    console.log('   • Admin: admin@example.com / Welcome123!');
    console.log('   • Regular users: testuser1@example.com through testuser25@example.com / Welcome123!');
    console.log('\n📅 Appointments span: Last 30 days to next 30 days');
    console.log('   • Past dates: Mostly completed/cancelled');
    console.log('   • Today: Mix of confirmed/pending');
    console.log('   • Next week: Mostly confirmed');
    console.log('   • Future: Mostly pending');
    
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
