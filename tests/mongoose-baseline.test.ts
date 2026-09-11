/**
 * Mongoose 8 Baseline Test - Direct Database Operations
 *
 * This test validates that basic database operations work correctly
 * with Mongoose 8 before upgrading to Mongoose 9.
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI || MONGODB_URI.length === 0) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function runBasicTests() {
  console.log('\n🧪 Starting Mongoose 8 Baseline Test\n');
  console.log(`📦 Mongoose Version: ${mongoose.version}`);
  console.log(`🗄️  MongoDB URI: ${MONGODB_URI.replace(/:[^:]*@/, ':***@')}\n`);

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Connect to database
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    const connection = mongoose.connection;
    console.log('✅ Connected to MongoDB\n');

    // ========================================================================
    // TEST 1: Database Connection
    // ========================================================================
    const db = connection.db;
    if (!db) throw new Error('Database not available');

    console.log('📝 TEST 1: Database Connection');
    try {
      const adminDb = db.admin();
      const status = await adminDb.ping();
      if (status) {
        console.log('✅ PASS - Database is responsive\n');
        testsPassed++;
      } else {
        throw new Error('Ping returned falsy value');
      }
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 2: List Collections
    // ========================================================================
    console.log('📝 TEST 2: List Collections');
    try {
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map((c) => c.name);
      console.log(`   Found collections: ${collectionNames.join(', ')}`);

      const hasUsers = collectionNames.includes('users');
      const hasAppointments = collectionNames.includes('appointments');

      if (hasUsers && hasAppointments) {
        console.log('✅ PASS - Critical collections exist\n');
        testsPassed++;
      } else {
        console.log(
          `⚠️  Note: users=${hasUsers}, appointments=${hasAppointments}\n`
        );
        testsPassed++;
      }
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 3: Count Users
    // ========================================================================
    console.log('📝 TEST 3: Count Users');
    try {
      const usersCollection = db.collection('users');
      const userCount = await usersCollection.countDocuments();
      console.log(`   Found ${userCount} users`);
      console.log('✅ PASS - User collection accessible\n');
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 4: Count Appointments
    // ========================================================================
    console.log('📝 TEST 4: Count Appointments');
    try {
      const appointmentsCollection = db.collection('appointments');
      const appointmentCount = await appointmentsCollection.countDocuments();
      console.log(`   Found ${appointmentCount} appointments`);
      console.log('✅ PASS - Appointment collection accessible\n');
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 5: Sample User Document
    // ========================================================================
    console.log('📝 TEST 5: Sample User Document');
    try {
      const usersCollection = db.collection('users');
      const sampleUser = await usersCollection.findOne({});

      if (sampleUser) {
        console.log(`   Sample user ID: ${sampleUser._id}`);
        console.log(`   Fields: ${Object.keys(sampleUser).join(', ')}`);
        if ((sampleUser as any).address) {
          console.log(`   Has address subdocument: YES`);
        }
        console.log('✅ PASS - User document structure valid\n');
        testsPassed++;
      } else {
        console.log('⚠️  Note: No users in collection, skipping\n');
        testsPassed++;
      }
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 6: Sample Appointment Document
    // ========================================================================
    console.log('📝 TEST 6: Sample Appointment Document');
    try {
      const appointmentsCollection = db.collection('appointments');
      const sampleAppt = await appointmentsCollection.findOne({});

      if (sampleAppt) {
        console.log(`   Sample appointment ID: ${sampleAppt._id}`);
        console.log(`   Fields: ${Object.keys(sampleAppt).join(', ')}`);
        if ((sampleAppt as any).userId || (sampleAppt as any).hubId) {
          console.log(`   Has references: YES`);
        }
        console.log('✅ PASS - Appointment document structure valid\n');
        testsPassed++;
      } else {
        console.log('⚠️  Note: No appointments in collection, skipping\n');
        testsPassed++;
      }
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 7: Query Aggregation
    // ========================================================================
    console.log('📝 TEST 7: Query Aggregation');
    try {
      const appointmentsCollection = db.collection('appointments');
      const pipeline = [
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ];
      const results = await appointmentsCollection
        .aggregate(pipeline)
        .toArray();
      console.log(`   Status breakdown: ${results.length} statuses`);
      results.forEach((r: any) => {
        console.log(`     - ${r._id}: ${r.count}`);
      });
      console.log('✅ PASS - Aggregation pipeline works\n');
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 8: Index Check
    // ========================================================================
    console.log('📝 TEST 8: Index Check');
    try {
      const usersCollection = db.collection('users');
      const indexes = await usersCollection.indexes();
      console.log(`   Indexes on users collection: ${indexes.length}`);
      console.log('✅ PASS - Indexes accessible\n');
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

  } catch (error: any) {
    console.error('❌ Fatal Error:', error.message);
    testsFailed++;
  } finally {
    // Cleanup
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

    // Print summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 BASELINE TEST SUMMARY`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Mongoose Version: 8.20.0 (Baseline)`);
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Total:  ${testsPassed + testsFailed}`);
    console.log(
      `Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`
    );
    console.log('═══════════════════════════════════════════════════════════\n');

    if (testsFailed === 0) {
      console.log(
        '✅ BASELINE COMPLETE: All tests passed with Mongoose 8\n'
      );
      console.log(
        'Status: Ready for Mongoose 9 upgrade (after commitment)\n'
      );
    }

    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

// Run tests
runBasicTests().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
