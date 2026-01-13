import dotenv from 'dotenv';
import mongoose from 'mongoose';
import '../models/User';

// Load environment variables
dotenv.config({ path: '.env.local' });

const User = mongoose.models.User;

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    //const email = 'jjaramillo7@schools.nyc.gov';
    const email = 'amahon@schools.nyc.gov';
    const password = 'Welcome12345!';
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`⚠️  User with email ${email} already exists.`);
      console.log('Updating to admin user...');
      
      // Update existing user to be admin
      // Set password as plain text - Mongoose pre-save hook will hash it
      existingUser.isAdmin = true;
      existingUser.password = password; // Plain text - will be hashed by pre-save hook
      await existingUser.save();
      
      console.log(`✅ Updated user ${email} to admin with new password`);
      console.log(`   Name: ${existingUser.firstName} ${existingUser.lastName}`);
      console.log(`   isAdmin: ${existingUser.isAdmin}`);
    } else {
      // Create new admin user
      // Set password as plain text - Mongoose pre-save hook will hash it
      const adminUser = new User({
      //  firstName: 'Javier',
      //  lastName: 'Jaramillo',
      //  email: email,
      //  password: password, // Plain text - will be hashed by pre-save hook
      //  phone: '555-000-0000',
      //  dateOfBirth: new Date(1985, 5, 15),
      //  sex: 'Male',
      //  preferredLanguage: 'English',
      //  additionalLanguages: [],
      //  heardFrom: 'Other',
      //  barriersToLearning: ['Technology'],
      //  homeAddress: {
      //    street: 'NYC DOE District 79',
      //    city: 'New York',
      //    state: 'NY',
      //    zipCode: '10001'
      //  },
      //  address: {
      //    street: 'NYC DOE District 79',
      //    city: 'New York',
      //    state: 'NY',
      //    zipCode: '10001'
      //  },
      //  educationLevel: 'Graduate Degree',
      //  employmentStatus: 'Employed',
      //  employerName: 'NYC DOE District 79',
      //  jobTitle: 'Data Systems Administrator',
      //  schoolInterest: 'School 1',
      //  programInterests: ['CTE'],
      //  emergencyContact: {
      //    name: 'Emergency Contact',
      //    relationship: 'Other',
      //    phone: '555-000-0001'
      //  },
      //  isAdmin: true
      //},
        firstName: 'Adeyemi',
        lastName: 'Mahon',
        email: 'amahon@schools.nyc.gov',
        password: 'Welcome12345!',
        phone: '555-000-0002',
        dateOfBirth: new Date(1985, 5, 15),
        sex: 'Male',
        preferredLanguage: 'English',
        additionalLanguages: [],
        heardFrom: 'Other',
        barriersToLearning: ['Technology'],
        homeAddress: {
          street: 'NYC DOE District 79',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        },
        address: {
          street: 'NYC DOE District 79',
          city: 'New York',
          state: 'NY',
          zipCode: '10001'
        },
        educationLevel: 'Graduate Degree',
        employmentStatus: 'Employed',
        employerName: 'NYC DOE District 79',
        jobTitle: 'Data Systems Administrator',
        schoolInterest: 'School 1',
        programInterests: ['CTE'],
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Other',
          phone: '555-000-0001'
        },
        isAdmin: true
      }
    );
      
      await adminUser.save();
      console.log(`✅ Created admin user: ${email}`);
      console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`   Password: ${password}`);
      console.log(`   isAdmin: ${adminUser.isAdmin}`);
    }
    
    // Verify the admin user
    const adminUsers = await User.find({ email, isAdmin: true });
    if (adminUsers.length > 0) {
      console.log('\n✅ Admin user verified successfully!');
      console.log(`   Email: ${email}`);
      console.log(`   isAdmin: true`);
    } else {
      console.log('\n❌ Error: Admin user was not created properly');
    }
    
  } catch (error: any) {
    console.error('❌ Error creating admin user:', error);
    if (error.code === 11000) {
      console.error('   Duplicate email error - user may already exist');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createAdminUser();

