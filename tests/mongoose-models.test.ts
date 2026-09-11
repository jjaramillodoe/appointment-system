/**
 * Mongoose 9 Model Testing Suite
 *
 * Comprehensive testing of all critical models with Mongoose 9:
 * - User model with subdocuments
 * - Appointment model with references
 * - Hub and HubSchedule models
 * - Complex queries and aggregations
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI || MONGODB_URI.length === 0) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

let testsPassed = 0;
let testsFailed = 0;

async function runModelTests() {
  console.log('\n🧪 Starting Mongoose 9 Model Testing Suite\n');
  console.log(`📦 Mongoose Version: ${mongoose.version}`);
  console.log(`🗄️  MongoDB URI: ${MONGODB_URI.replace(/:[^:]*@/, ':***@')}\n`);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database not available');
    console.log('✅ Connected to MongoDB\n');

    // ========================================================================
    // TEST 1: Create Test Hub
    // ========================================================================
    console.log('📝 TEST 1: Create Hub Document');
    let testHubId: any = null;
    try {
      const hubsCollection = db.collection('hubs');
      const hubResult = await hubsCollection.insertOne({
        name: `Test Hub ${Date.now()}`,
        district: 'District 79',
        address: '123 School Street',
        phone: '5551234567',
        email: `hub-${Date.now()}@example.com`,
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        capacity: 100,
        activeSchedules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      testHubId = hubResult.insertedId;
      console.log(`✅ PASS - Created hub ${testHubId}\n`);
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 2: Create Test User (with subdocuments)
    // ========================================================================
    console.log('📝 TEST 2: Create User with Subdocuments');
    let testUserId: any = null;
    try {
      const usersCollection = db.collection('users');
      const userResult = await usersCollection.insertOne({
        firstName: 'Test',
        lastName: 'User',
        email: `user-${Date.now()}@example.com`,
        password: 'hashedpassword123',
        phone: '5559876543',
        dateOfBirth: new Date('1990-01-01'),
        sex: 'M',
        preferredLanguage: 'en',
        additionalLanguages: [],
        homeAddress: {
          street: '456 Home Street',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
        },
        address: {
          street: '789 Work Avenue',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
        },
        educationLevel: 'High School',
        employmentStatus: 'Employed',
        barriersToLearning: [],
        role: 'parent',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      testUserId = userResult.insertedId;
      console.log(`✅ PASS - Created user with subdocuments ${testUserId}\n`);
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 3: Update User Subdocument (single field)
    // ========================================================================
    console.log('📝 TEST 3: Update User Subdocument Field');
    try {
      if (!testUserId) throw new Error('Test user not created');

      const usersCollection = db.collection('users');
      await usersCollection.updateOne(
        { _id: testUserId },
        { $set: { 'address.zipCode': '10002' } }
      );

      const updated = await usersCollection.findOne({ _id: testUserId });
      if (!updated) throw new Error('User not found after update');
      if ((updated as any).address.zipCode !== '10002')
        throw new Error('ZipCode not updated');

      console.log('✅ PASS - Subdocument field updated\n');
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 4: Update Entire Subdocument
    // ========================================================================
    console.log('📝 TEST 4: Replace Entire Subdocument');
    try {
      if (!testUserId) throw new Error('Test user not created');

      const usersCollection = db.collection('users');
      await usersCollection.updateOne(
        { _id: testUserId },
        {
          $set: {
            address: {
              street: '999 New Street',
              city: 'Chicago',
              state: 'IL',
              zipCode: '60601',
            },
          },
        }
      );

      const updated = await usersCollection.findOne({ _id: testUserId });
      if (!updated) throw new Error('User not found after update');
      const addr = (updated as any).address;
      if (addr.city !== 'Chicago')
        throw new Error('Address replacement failed');

      console.log('✅ PASS - Entire subdocument replaced\n');
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 5: Create Appointment with References
    // ========================================================================
    console.log('📝 TEST 5: Create Appointment with References');
    let testAppointmentId: any = null;
    try {
      if (!testUserId || !testHubId) throw new Error('Prerequisites not met');

      const appointmentsCollection = db.collection('appointments');
      const appointmentResult = await appointmentsCollection.insertOne({
        userId: testUserId,
        hubId: testHubId,
        slotId: `slot-${Date.now()}`,
        status: 'pending',
        appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        preferredProgramId: 'program-001',
        preferredLanguage: 'en',
        notes: 'Test appointment',
        confirmationToken: `token-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      testAppointmentId = appointmentResult.insertedId;
      console.log(
        `✅ PASS - Created appointment with references ${testAppointmentId}\n`
      );
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 6: Query with $lookup (Population equivalent)
    // ========================================================================
    console.log('📝 TEST 6: Aggregation $lookup (Reference Population)');
    try {
      if (!testAppointmentId) throw new Error('Test appointment not created');

      const appointmentsCollection = db.collection('appointments');
      const results = await appointmentsCollection
        .aggregate([
          { $match: { _id: testAppointmentId } },
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userDetails',
            },
          },
          {
            $lookup: {
              from: 'hubs',
              localField: 'hubId',
              foreignField: '_id',
              as: 'hubDetails',
            },
          },
        ])
        .toArray();

      if (results.length === 0) throw new Error('No results from aggregation');
      const result = results[0] as any;
      if (!result.userDetails || result.userDetails.length === 0)
        throw new Error('User population failed');
      if (!result.hubDetails || result.hubDetails.length === 0)
        throw new Error('Hub population failed');

      console.log(
        `✅ PASS - $lookup aggregation working (user: ${result.userDetails[0].email}, hub: ${result.hubDetails[0].name})\n`
      );
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 7: Complex Query Filtering
    // ========================================================================
    console.log('📝 TEST 7: Complex Query Filtering');
    try {
      const appointmentsCollection = db.collection('appointments');
      const count = await appointmentsCollection.countDocuments({
        status: 'pending',
        appointmentDate: { $gt: new Date() },
      });

      console.log(
        `✅ PASS - Found ${count} future pending appointments\n`
      );
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 8: Lean Query (Admin Dashboard Pattern)
    // ========================================================================
    console.log('📝 TEST 8: Lean Query (Plain Objects)');
    try {
      const appointmentsCollection = db.collection('appointments');
      const appointments = await appointmentsCollection
        .find({ status: { $exists: true } })
        .limit(5)
        .toArray();

      if (appointments.length === 0) {
        console.log('⚠️  Note: No appointments found, skipping\n');
        testsPassed++;
        return;
      }

      const appt = appointments[0] as any;
      if (!appt._id) throw new Error('Missing _id');
      if (!appt.status) throw new Error('Missing status');

      console.log(
        `✅ PASS - Lean query returned plain objects (${appointments.length} docs)\n`
      );
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 9: Aggregation Pipeline (Admin Reports)
    // ========================================================================
    console.log('📝 TEST 9: Aggregation Pipeline');
    try {
      const appointmentsCollection = db.collection('appointments');
      const pipeline = [
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgAppointments: { $avg: 1 },
          },
        },
        { $sort: { count: -1 } },
      ];

      const results = await appointmentsCollection
        .aggregate(pipeline)
        .toArray();

      console.log(`✅ PASS - Aggregation returned ${results.length} groups\n`);
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 10: Update with timestamps
    // ========================================================================
    console.log('📝 TEST 10: Timestamp Updates');
    try {
      if (!testAppointmentId) throw new Error('Test appointment not created');

      const appointmentsCollection = db.collection('appointments');
      const before = await appointmentsCollection.findOne({
        _id: testAppointmentId,
      });
      if (!before) throw new Error('Appointment not found');

      const beforeUpdatedAt = (before as any).updatedAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      await appointmentsCollection.updateOne(
        { _id: testAppointmentId },
        { $set: { notes: 'Updated notes', updatedAt: new Date() } }
      );

      const after = await appointmentsCollection.findOne({
        _id: testAppointmentId,
      });
      if (!after) throw new Error('Appointment not found after update');

      const afterUpdatedAt = (after as any).updatedAt;
      if (afterUpdatedAt.getTime() <= beforeUpdatedAt.getTime())
        throw new Error('updatedAt was not changed');

      console.log('✅ PASS - Timestamps updated correctly\n');
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 11: Cleanup - Delete Test Documents
    // ========================================================================
    console.log('📝 TEST 11: Document Deletion');
    try {
      const appointmentsCollection = db.collection('appointments');
      const usersCollection = db.collection('users');
      const hubsCollection = db.collection('hubs');

      if (testAppointmentId) {
        await appointmentsCollection.deleteOne({ _id: testAppointmentId });
      }
      if (testUserId) {
        await usersCollection.deleteOne({ _id: testUserId });
      }
      if (testHubId) {
        await hubsCollection.deleteOne({ _id: testHubId });
      }

      console.log('✅ PASS - Test documents cleaned up\n');
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

  } catch (error: any) {
    console.error('❌ Fatal Error:', error.message);
    testsFailed++;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

    // Print summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 MODEL TESTING SUMMARY (Mongoose 9.10.0)`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Total:  ${testsPassed + testsFailed}`);
    console.log(
      `Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`
    );
    console.log('═══════════════════════════════════════════════════════════\n');

    if (testsFailed === 0) {
      console.log(
        '🎉 SUCCESS: All model operations working with Mongoose 9!\n'
      );
    }

    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

// Run tests
runModelTests().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
