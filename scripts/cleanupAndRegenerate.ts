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
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function cleanupDatabase() {
  console.log('🧹 Cleaning up existing test data...');
  
  try {
    // Drop the problematic unique index
    if (!mongoose.connection.db) {
      console.log('⚠️  Database connection not available');
      return;
    }
    
    const collection = mongoose.connection.db.collection('appointmentoptimizeds');
    const indexes = await collection.indexes();
    
    for (const index of indexes) {
      if (index.key && index.key.userId === 1 && index.unique && index.name) {
        console.log('🗑️  Dropping unique index on userId...');
        await collection.dropIndex(index.name);
        console.log('✅ Dropped unique index on userId');
        break;
      }
    }
    
    // Clear existing test data
    const userResult = await User.deleteMany({ email: { $regex: /^testuser/ } });
    const adminResult = await User.deleteMany({ email: 'admin@example.com' });
    const appointmentResult = await AppointmentOptimized.deleteMany({ notes: { $regex: /^Test appointment/ } });
    
    console.log(`🗑️  Deleted ${userResult.deletedCount} test users`);
    console.log(`🗑️  Deleted ${adminResult.deletedCount} admin users`);
    console.log(`🗑️  Deleted ${appointmentResult.deletedCount} test appointments`);
    
    console.log('✅ Database cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function main() {
  try {
    await connectDB();
    
    console.log('🚀 Starting database cleanup and regeneration...\n');
    
    // Clean up first
    await cleanupDatabase();
    
    console.log('\n🔄 Now run the generateTestData.ts script to create fresh test data');
    
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
