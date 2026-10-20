import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { seedEnrollmentCatalog } from '../lib/enrollmentSeed';

dotenv.config({ path: '.env.local' });

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system';
  await mongoose.connect(uri);
  const seeded = await seedEnrollmentCatalog();
  console.log('Enrollment catalog seeded');
  console.log(`   Schools: ${seeded.schools}`);
  console.log(`   Linked hubs: ${seeded.hubs}`);
  console.log(`   Classes: ${seeded.classes}`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Failed to seed enrollment catalog:', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
