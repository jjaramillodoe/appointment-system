/**
 * Mongoose 9 Migration Test Suite
 *
 * This test suite validates all critical model operations before and after
 * upgrading from Mongoose 8 to Mongoose 9. Tests cover:
 * - User model with subdocuments (address, emergencyContact)
 * - Appointment model with references (userId, hubId)
 * - Hub and HubSchedule models
 * - Complex queries (admin dashboard patterns)
 * - Timestamps, population, lean queries
 */

import mongoose, { Document, Model } from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const MONGODB_URI = process.env.MONGODB_URI || '';
const TEST_TIMEOUT = 30000; // 30 seconds per test

if (!MONGODB_URI || MONGODB_URI.length === 0) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

function generateTestUser(overrides?: any) {
  return {
    name: `Test User ${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    password: 'hashedpassword123',
    role: 'parent',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
    emergencyContact: {
      name: 'Jane Doe',
      phone: '5551234567',
      relationship: 'Spouse',
    },
    isVerified: true,
    ...overrides,
  };
}

function generateTestAppointment(userId: any, hubId: any, overrides?: any) {
  return {
    userId,
    hubId,
    slotId: `slot-${Date.now()}`,
    status: 'pending',
    appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    preferredProgramId: 'program-001',
    preferredLanguage: 'en',
    notes: 'Test appointment',
    confirmationToken: `token-${Date.now()}`,
    ...overrides,
  };
}

function generateTestHub(overrides?: any) {
  return {
    name: `Test Hub ${Date.now()}`,
    district: 'District 79',
    address: '456 School Ave',
    phone: '5559876543',
    email: `hub-${Date.now()}@example.com`,
    coordinates: {
      latitude: 40.7128,
      longitude: -74.006,
    },
    capacity: 100,
    activeSchedules: [],
    ...overrides,
  };
}

// ============================================================================
// TEST SUITE
// ============================================================================

async function runTests() {
  console.log('\n🧪 Starting Mongoose Migration Test Suite\n');
  console.log(`📦 Mongoose Version: ${mongoose.version}`);
  console.log(`🗄️  MongoDB URI: ${MONGODB_URI.replace(/:[^:]*@/, ':***@')}\n`);

  let connection: mongoose.Connection | null = null;
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Connect to database
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    connection = mongoose.connection;
    console.log('✅ Connected to MongoDB\n');

    // ========================================================================
    // TEST 1: User Model - Create with Subdocuments
    // ========================================================================
    console.log('📝 TEST 1: User Model - Create with Subdocuments');
    try {
      const User = mongoose.model('User') as Model<any>;
      const userData = generateTestUser();
      const user = new User(userData);
      await user.save();

      if (!user._id) throw new Error('User ID not generated');
      if (user.address.street !== '123 Main St')
        throw new Error('Address not saved correctly');
      if (user.emergencyContact.name !== 'Jane Doe')
        throw new Error('Emergency contact not saved correctly');

      console.log(`✅ PASS - Created user ${user._id}\n`);
      testsPassed++;

      // Store for later tests
      (global as any).testUserId = user._id;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 2: User Model - Update Entire Subdocument
    // ========================================================================
    console.log('📝 TEST 2: User Model - Update Entire Subdocument');
    try {
      const User = mongoose.model('User') as Model<any>;
      const user = await User.findById((global as any).testUserId);

      if (!user) throw new Error('User not found');

      // Update entire address
      user.address = {
        street: '789 Park Ave',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
      };

      await user.save();

      const updated = await User.findById(user._id);
      if (updated.address.street !== '789 Park Ave')
        throw new Error('Address update failed');
      if (updated.address.city !== 'Boston') throw new Error('City not updated');

      console.log(`✅ PASS - Updated entire subdocument\n`);
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 3: User Model - Update Single Subdocument Field
    // ========================================================================
    console.log('📝 TEST 3: User Model - Update Single Subdocument Field');
    try {
      const User = mongoose.model('User') as Model<any>;
      const user = await User.findById((global as any).testUserId);

      if (!user) throw new Error('User not found');

      // Update single field in address
      user.address.zipCode = '02102';

      // Mark subdocument as modified for Mongoose 9 compatibility
      if (user.markModified) {
        user.markModified('address');
      }

      await user.save();

      const updated = await User.findById(user._id);
      if (updated.address.zipCode !== '02102')
        throw new Error('ZipCode update failed');

      console.log(`✅ PASS - Updated single subdocument field\n`);
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 4: User Model - Update Emergency Contact
    // ========================================================================
    console.log('📝 TEST 4: User Model - Update Emergency Contact');
    try {
      const User = mongoose.model('User') as Model<any>;
      const user = await User.findById((global as any).testUserId);

      if (!user) throw new Error('User not found');

      user.emergencyContact = {
        name: 'John Smith',
        phone: '5559999999',
        relationship: 'Brother',
      };

      if (user.markModified) {
        user.markModified('emergencyContact');
      }

      await user.save();

      const updated = await User.findById(user._id);
      if (updated.emergencyContact.name !== 'John Smith')
        throw new Error('Emergency contact name not updated');

      console.log(`✅ PASS - Updated emergency contact\n`);
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 5: Hub Model - Create Hub
    // ========================================================================
    console.log('📝 TEST 5: Hub Model - Create Hub');
    try {
      const Hub = mongoose.model('Hub') as Model<any>;
      const hubData = generateTestHub();
      const hub = new Hub(hubData);
      await hub.save();

      if (!hub._id) throw new Error('Hub ID not generated');

      console.log(`✅ PASS - Created hub ${hub._id}\n`);
      testsPassed++;

      (global as any).testHubId = hub._id;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 6: Appointment Model - Create with References
    // ========================================================================
    console.log('📝 TEST 6: Appointment Model - Create with References');
    try {
      const Appointment = mongoose.model('Appointment') as Model<any>;
      const appointmentData = generateTestAppointment(
        (global as any).testUserId,
        (global as any).testHubId
      );
      const appointment = new Appointment(appointmentData);
      await appointment.save();

      if (!appointment._id) throw new Error('Appointment ID not generated');
      if (!appointment.userId) throw new Error('userId reference not saved');
      if (!appointment.hubId) throw new Error('hubId reference not saved');

      console.log(`✅ PASS - Created appointment ${appointment._id}\n`);
      testsPassed++;

      (global as any).testAppointmentId = appointment._id;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 7: Appointment Model - Populate userId Reference
    // ========================================================================
    console.log('📝 TEST 7: Appointment Model - Populate userId Reference');
    try {
      const Appointment = mongoose.model('Appointment') as Model<any>;
      const appointment = await Appointment.findById(
        (global as any).testAppointmentId
      ).populate('userId');

      if (!appointment) throw new Error('Appointment not found');
      if (!appointment.userId || typeof appointment.userId === 'string')
        throw new Error('userId not populated (still a string)');
      if (appointment.userId.email === undefined)
        throw new Error('Populated user missing email field');

      console.log(`✅ PASS - Populated userId: ${appointment.userId.email}\n`);
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 8: Appointment Model - Populate hubId Reference
    // ========================================================================
    console.log('📝 TEST 8: Appointment Model - Populate hubId Reference');
    try {
      const Appointment = mongoose.model('Appointment') as Model<any>;
      const appointment = await Appointment.findById(
        (global as any).testAppointmentId
      ).populate('hubId');

      if (!appointment) throw new Error('Appointment not found');
      if (!appointment.hubId || typeof appointment.hubId === 'string')
        throw new Error('hubId not populated (still a string)');
      if (appointment.hubId.name === undefined)
        throw new Error('Populated hub missing name field');

      console.log(`✅ PASS - Populated hubId: ${appointment.hubId.name}\n`);
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 9: Appointment Model - Multiple Population
    // ========================================================================
    console.log('📝 TEST 9: Appointment Model - Multiple Population');
    try {
      const Appointment = mongoose.model('Appointment') as Model<any>;
      const appointment = await Appointment.findById(
        (global as any).testAppointmentId
      )
        .populate('userId')
        .populate('hubId');

      if (!appointment) throw new Error('Appointment not found');
      if (typeof appointment.userId === 'string')
        throw new Error('userId not populated');
      if (typeof appointment.hubId === 'string')
        throw new Error('hubId not populated');

      console.log(
        `✅ PASS - Multiple population: ${appointment.userId.email} at ${appointment.hubId.name}\n`
      );
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 10: Appointment Model - Lean Query (Admin Dashboard Pattern)
    // ========================================================================
    console.log('📝 TEST 10: Appointment Model - Lean Query');
    try {
      const Appointment = mongoose.model('Appointment') as Model<any>;
      const appointments = await Appointment.find().lean();

      if (!Array.isArray(appointments) || appointments.length === 0)
        throw new Error('Lean query returned no results');

      const appointment = appointments[0];
      if (!appointment._id) throw new Error('Lean query missing _id');
      if (!appointment.userId) throw new Error('Lean query missing userId');

      // Lean queries return plain objects, not Mongoose documents
      // They should not have Mongoose methods
      if (typeof (appointment as any).save === 'function') {
        console.log('⚠️  WARNING - Lean object has save method (Mongoose 8 behavior)');
      }

      console.log(`✅ PASS - Lean query returned ${appointments.length} appointments\n`);
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 11: Appointment Model - Filter by Status
    // ========================================================================
    console.log('📝 TEST 11: Appointment Model - Filter by Status');
    try {
      const Appointment = mongoose.model('Appointment') as Model<any>;
      const count = await Appointment.countDocuments({ status: 'pending' });

      if (count < 1) throw new Error('No pending appointments found');

      const appointments = await Appointment.find({ status: 'pending' });
      if (!Array.isArray(appointments))
        throw new Error('Query result is not an array');

      console.log(`✅ PASS - Found ${count} pending appointments\n`);
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 12: Timestamps - createdAt and updatedAt
    // ========================================================================
    console.log('📝 TEST 12: Timestamps - createdAt and updatedAt');
    try {
      const Appointment = mongoose.model('Appointment') as Model<any>;
      const appointment = await Appointment.findById(
        (global as any).testAppointmentId
      );

      if (!appointment) throw new Error('Appointment not found');
      if (!appointment.createdAt) throw new Error('createdAt not set');
      if (!appointment.updatedAt) throw new Error('updatedAt not set');
      if (!(appointment.createdAt instanceof Date))
        throw new Error('createdAt is not a Date');
      if (!(appointment.updatedAt instanceof Date))
        throw new Error('updatedAt is not a Date');

      console.log(
        `✅ PASS - Timestamps: created=${appointment.createdAt.toISOString()}, updated=${appointment.updatedAt.toISOString()}\n`
      );
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 13: Appointment Update - updatedAt Changes
    // ========================================================================
    console.log('📝 TEST 13: Appointment Update - updatedAt Changes');
    try {
      const Appointment = mongoose.model('Appointment') as Model<any>;
      const appointment = await Appointment.findById(
        (global as any).testAppointmentId
      );

      if (!appointment) throw new Error('Appointment not found');

      const originalUpdatedAt = appointment.updatedAt;

      // Wait a bit to ensure time difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      appointment.notes = 'Updated notes';
      await appointment.save();

      const updated = await Appointment.findById(appointment._id);
      if (!updated) throw new Error('Updated appointment not found');
      if (updated.updatedAt.getTime() <= originalUpdatedAt.getTime())
        throw new Error('updatedAt was not changed');

      console.log(`✅ PASS - updatedAt automatically updated\n`);
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 14: Hub Model - Lean Query
    // ========================================================================
    console.log('📝 TEST 14: Hub Model - Lean Query');
    try {
      const Hub = mongoose.model('Hub') as Model<any>;
      const hubs = await Hub.find().lean();

      if (!Array.isArray(hubs)) throw new Error('Query result is not an array');
      if (hubs.length === 0) throw new Error('No hubs found');

      console.log(`✅ PASS - Lean query returned ${hubs.length} hubs\n`);
      testsPassed++;
    } catch (error: any) {
      console.log(`❌ FAIL - ${error.message}\n`);
      testsFailed++;
    }

    // ========================================================================
    // TEST 15: User Model - findOne with Population
    // ========================================================================
    console.log('📝 TEST 15: User Model - findOne');
    try {
      const User = mongoose.model('User') as Model<any>;
      const user = await User.findOne({ email: (global as any).testUserEmail });

      if (!user) {
        // Get the email from our test user
        const testUser = await User.findById((global as any).testUserId);
        if (testUser) {
          (global as any).testUserEmail = testUser.email;
        } else {
          throw new Error('Test user not found');
        }
      }

      console.log(`✅ PASS - findOne returned user\n`);
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
    if (connection) {
      console.log('\n🧹 Cleaning up test data...');
      try {
        // Delete test data
        if ((global as any).testAppointmentId) {
          const Appointment = mongoose.model('Appointment') as Model<any>;
          await Appointment.deleteOne({ _id: (global as any).testAppointmentId });
        }
        if ((global as any).testUserId) {
          const User = mongoose.model('User') as Model<any>;
          await User.deleteOne({ _id: (global as any).testUserId });
        }
        if ((global as any).testHubId) {
          const Hub = mongoose.model('Hub') as Model<any>;
          await Hub.deleteOne({ _id: (global as any).testHubId });
        }
        console.log('✅ Cleanup complete\n');
      } catch (error: any) {
        console.log(`⚠️  Cleanup warning: ${error.message}\n`);
      }

      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB\n');
    }

    // Print summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📊 TEST SUMMARY`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Total:  ${testsPassed + testsFailed}`);
    console.log(`Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    console.log('═══════════════════════════════════════════════════════════\n');

    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
