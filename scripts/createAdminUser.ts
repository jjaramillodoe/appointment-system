import dotenv from 'dotenv';
import mongoose from 'mongoose';
import '../models/User';
import '../models/Hub';
import '../models/Appointment';

// Load environment variables
dotenv.config({ path: '.env.local' });

const User = mongoose.models.User;
const Hub = mongoose.models.Hub;
const Appointment = mongoose.models.Appointment;

/**
 * Delete a user and all their associated appointments
 */
async function deleteUser(email: string) {
  const user = await User.findOne({ email });
  if (user) {
    console.log(`   🗑️  Deleting user: ${email}`);
    // Delete all appointments for this user
    const deletedAppointments = await Appointment.deleteMany({ userId: user._id });
    console.log(`      Deleted ${deletedAppointments.deletedCount} associated appointments`);
    // Delete the user
    await User.deleteOne({ _id: user._id });
    console.log(`      ✅ User deleted`);
    return true;
  }
  return false;
}

/**
 * Create or update an admin user
 */
async function createAdminUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  isSuperAdmin: boolean,
  hubName: string | null
) {
  console.log(`\n📋 Creating admin: ${email}`);
  console.log(`   Name: ${firstName} ${lastName}`);
  console.log(`   Super Admin: ${isSuperAdmin}`);
  console.log(`   Assigned Hub: ${hubName || 'None (Super Admin)'}`);

  // Get hub ID if hub name is provided
  let assignedHubId = null;
  if (hubName && !isSuperAdmin) {
    const hub = await Hub.findOne({ name: hubName });
    if (!hub) {
      console.log(`\n⚠️  Hub "${hubName}" not found. Available hubs:`);
      const allHubs = await Hub.find({ isActive: true });
      allHubs.forEach(h => console.log(`   - ${h.name}`));
      throw new Error(`Hub "${hubName}" not found`);
    }
    assignedHubId = hub._id;
    console.log(`   ✅ Found hub: ${hub.name} (ID: ${assignedHubId})`);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log(`   ⚠️  User already exists, updating...`);
    existingUser.firstName = firstName;
    existingUser.lastName = lastName;
    existingUser.isAdmin = true;
    existingUser.isSuperAdmin = isSuperAdmin;
    existingUser.assignedHub = assignedHubId;
    existingUser.password = password; // Plain text - will be hashed by pre-save hook
    await existingUser.save();
    
    console.log(`   ✅ Updated user ${email}`);
    return existingUser;
  } else {
    // Create new admin user
    const adminUser = new User({
      firstName,
      lastName,
      email,
      password, // Plain text - will be hashed by pre-save hook
      phone: '555-000-0000',
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
      schoolInterest: 'School 6',
      programInterests: ['CTE'],
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Other',
        phone: '555-000-0001'
      },
      isAdmin: true,
      isSuperAdmin: isSuperAdmin,
      assignedHub: assignedHubId
    });
    
    await adminUser.save();
    console.log(`   ✅ Created admin user: ${email}`);
    return adminUser;
  }
}

async function main() {
  try {
    console.log('🔧 Setting up admin users...\n');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Delete existing users
    console.log('🗑️  Deleting existing users...');
    const deleted1 = await deleteUser('jjaramillo7@schools.nyc.gov');
    const deleted2 = await deleteUser('amahon@schools.nyc.gov');
    if (!deleted1 && !deleted2) {
      console.log('   ℹ️  No existing users found to delete\n');
    } else {
      console.log('');
    }

    // Create jjaramillo7 as super-admin
    await createAdminUser(
      'jjaramillo7@schools.nyc.gov',
      'Welcome12345!',
      'Javier',
      'Jaramillo',
      true, // isSuperAdmin
      null  // no hub assignment
    );

    // Create amahon as hub-admin for "Adult Education School 6 at Coney Island Avenue"
    await createAdminUser(
      'amahon@schools.nyc.gov',
      'Welcome12345!',
      'Adeyemi',
      'Mahon',
      false, // not super-admin
      'Adult Education School 6 at Coney Island Avenue' // assigned hub
    );

    // Verify the admin users
    console.log('\n✅ Verifying admin users...');
    const jjaramillo = await User.findOne({ email: 'jjaramillo7@schools.nyc.gov' });
    const amahon = await User.findOne({ email: 'amahon@schools.nyc.gov' });

    if (jjaramillo && jjaramillo.isAdmin && jjaramillo.isSuperAdmin) {
      console.log(`   ✅ jjaramillo7@schools.nyc.gov - Super Admin`);
    } else {
      console.log(`   ❌ jjaramillo7@schools.nyc.gov - Verification failed`);
    }

    if (amahon && amahon.isAdmin && !amahon.isSuperAdmin && amahon.assignedHub) {
      const hub = await Hub.findById(amahon.assignedHub);
      console.log(`   ✅ amahon@schools.nyc.gov - Hub Admin (${hub?.name || 'Unknown Hub'})`);
    } else {
      console.log(`   ❌ amahon@schools.nyc.gov - Verification failed`);
    }

    console.log('\n✅ Admin user setup complete!');
    
  } catch (error: any) {
    console.error('\n❌ Error setting up admin users:', error);
    if (error.code === 11000) {
      console.error('   Duplicate email error - user may already exist');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Support command-line arguments for single user creation (backward compatibility)
async function createSingleUser() {
  const email = process.argv[2];
  const password = process.argv[3] || 'Welcome12345!';
  const isSuperAdmin = process.argv[4] === 'true' || process.argv[4] === 'super';
  const hubName = process.argv[5] || null;

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    await createAdminUser(
      email,
      password,
      'Admin',
      'User',
      isSuperAdmin,
      hubName
    );

    console.log('\n✅ Admin user created!');
  } catch (error: any) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (process.argv[2]) {
  createSingleUser();
} else {
  // Run main setup function
  main();
}

