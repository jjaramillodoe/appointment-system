import dotenv from 'dotenv';
import mongoose from 'mongoose';
import '@/models/User';

// Load environment variables
dotenv.config({ path: '.env.local' });

const User = mongoose.models.User;

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking admin users in database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB');
    
    // Check total users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}`);
    
    // Check admin users
    const adminUsers = await User.find({ isAdmin: true });
    console.log(`\n👑 Admin users found: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log('\n👑 Admin user details:');
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`   isAdmin: ${user.isAdmin}`);
        console.log(`   schoolInterest: ${user.schoolInterest}`);
        console.log(`   createdAt: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('\n❌ No admin users found! This is why the principals search isn\'t working.');
      console.log('\n🔧 To fix this, you need to either:');
      console.log('1. Create a user with isAdmin: true, or');
      console.log('2. Update an existing user to have isAdmin: true');
      
      // Show some sample users
      const sampleUsers = await User.find().limit(5);
      if (sampleUsers.length > 0) {
        console.log('\n📋 Sample users (you can update one to be admin):');
        sampleUsers.forEach((user, index) => {
          console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
          console.log(`   isAdmin: ${user.isAdmin}`);
          console.log(`   schoolInterest: ${user.schoolInterest}`);
          console.log('');
        });
      }
    }

    // Test search functionality
    if (adminUsers.length > 0) {
      console.log('\n🔍 Testing search functionality...');
      const searchResults = await User.find({
        isAdmin: true,
        $or: [
          { firstName: { $regex: 'a', $options: 'i' } },
          { lastName: { $regex: 'a', $options: 'i' } },
          { email: { $regex: 'a', $options: 'i' } }
        ]
      }).select('firstName lastName email schoolInterest isAdmin');
      
      console.log(`Search results for 'a': ${searchResults.length}`);
      searchResults.forEach(result => {
        console.log(`- ${result.firstName} ${result.lastName} (${result.email})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkAdminUsers();
