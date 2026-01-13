import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import '../models/User';

// Load environment variables
dotenv.config({ path: '.env.local' });

const User = mongoose.models.User;

async function verifyAdminUser() {
  try {
    console.log('🔍 Verifying admin user...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const email = 'jjaramillo7@schools.nyc.gov';
    const testPassword = 'Welcome12345!';
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found in database`);
      console.log('\n🔍 Checking for similar emails...');
      const allUsers = await User.find({ email: { $regex: 'jjaramillo', $options: 'i' } });
      if (allUsers.length > 0) {
        console.log('Found similar emails:');
        allUsers.forEach(u => {
          console.log(`  - ${u.email} (isAdmin: ${u.isAdmin})`);
        });
      }
      return;
    }
    
    console.log(`✅ User found: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   isAdmin: ${user.isAdmin}`);
    console.log(`   Has password: ${!!user.password}`);
    
    // Test password
    console.log('\n🔐 Testing password...');
    const isPasswordValid = await user.comparePassword(testPassword);
    
    if (isPasswordValid) {
      console.log('✅ Password is valid!');
    } else {
      console.log('❌ Password does not match!');
      console.log('\n🔧 Attempting to reset password...');
      
      // Reset password
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      user.password = hashedPassword;
      await user.save();
      
      console.log('✅ Password has been reset');
      
      // Test again
      const isPasswordValidAfterReset = await user.comparePassword(testPassword);
      if (isPasswordValidAfterReset) {
        console.log('✅ Password reset successful and verified!');
      } else {
        console.log('❌ Password reset failed - please check bcrypt implementation');
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

verifyAdminUser();

