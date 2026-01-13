import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system';

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...');
  console.log(`   URI format: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  console.log('');

  try {
    const opts: any = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };

    // Only add retry options if not already in URI
    if (!MONGODB_URI.includes('retryWrites')) {
      opts.retryWrites = true;
    }
    if (!MONGODB_URI.includes('retryReads')) {
      opts.retryReads = true;
    }

    console.log('⏳ Attempting to connect...');
    await mongoose.connect(MONGODB_URI, opts);
    console.log('✅ MongoDB connection successful!');

    // Test a simple operation
    const adminDb = mongoose.connection.db?.admin();
    if (adminDb) {
      const serverStatus = await adminDb.serverStatus();
      console.log(`   MongoDB version: ${serverStatus.version}`);
    }

    // Check database
    const dbName = mongoose.connection.db?.databaseName;
    console.log(`   Database: ${dbName}`);

    // List collections
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log(`   Collections: ${collections?.length || 0}`);

    await mongoose.disconnect();
    console.log('\n✅ Connection test passed!');
  } catch (error: any) {
    console.log('❌ MongoDB connection failed!');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code || 'N/A'}`);
    console.log('');

    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      console.log('💡 Troubleshooting Steps:');
      console.log('');
      
      if (MONGODB_URI.includes('mongodb+srv://')) {
        console.log('   MongoDB Atlas Connection:');
        console.log('   1. Check your internet connection');
        console.log('   2. Verify MongoDB Atlas cluster is running');
        console.log('   3. Check IP whitelist in MongoDB Atlas:');
        console.log('      - Go to Network Access in Atlas dashboard');
        console.log('      - Add your IP or use 0.0.0.0/0 (less secure)');
        console.log('   4. Verify connection string is correct');
        console.log('   5. Check if DNS resolution works:');
        console.log('      - Try: nslookup cluster0.ld91pw7.mongodb.net');
        console.log('   6. Try using standard connection string instead of SRV:');
        console.log('      - Replace mongodb+srv:// with mongodb://');
        console.log('      - Use specific hostnames instead of SRV');
      } else {
        console.log('   Local MongoDB Connection:');
        console.log('   1. Check if MongoDB is running:');
        console.log('      - macOS: brew services list | grep mongodb');
        console.log('      - Linux: sudo systemctl status mongod');
        console.log('   2. Start MongoDB if not running:');
        console.log('      - macOS: brew services start mongodb-community');
        console.log('      - Linux: sudo systemctl start mongod');
        console.log('   3. Verify connection string:');
        console.log('      - Default: mongodb://localhost:27017/appointment-system');
      }
    } else if (error.message?.includes('authentication')) {
      console.log('💡 Authentication Error:');
      console.log('   1. Check username and password in connection string');
      console.log('   2. Verify database user has correct permissions');
    }

    process.exit(1);
  }
}

testConnection();
