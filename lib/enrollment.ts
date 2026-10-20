import mongoose from 'mongoose';
import School from '@/models/School';
import Hub from '@/models/Hub';
import ClassOffering from '@/models/ClassOffering';
import StudentRegistration from '@/models/StudentRegistration';
import User from '@/models/User';
import type { CreateRegistrationInput } from '@/lib/enrollmentSchema';

function asObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

export async function listActiveSchools() {
  return School.find({ status: 'active' })
    .select('_id name slug code email phone website status')
    .sort({ name: 1 })
    .lean();
}

export async function listHubsForSchool(schoolId: string) {
  if (!mongoose.isValidObjectId(schoolId)) return null;

  const school = await School.findById(schoolId).select('_id name status').lean();
  if (!school) return null;

  const hubs = await Hub.find({
    schoolId: school._id,
    isActive: true,
  })
    .select('_id name location timezone isActive schoolId')
    .sort({ name: 1 })
    .lean();

  return { school, hubs };
}

export async function listAvailableClasses(filters: { schoolId?: string | null; hubId?: string | null }) {
  const clauses: Record<string, unknown>[] = [{ status: 'active' }];

  if (filters.schoolId) {
    if (!mongoose.isValidObjectId(filters.schoolId)) {
      return { error: 'Invalid schoolId' as const };
    }
    clauses.push({
      $or: [{ schoolId: { $exists: false } }, { schoolId: null }, { schoolId: asObjectId(filters.schoolId) }],
    });
  }

  if (filters.hubId) {
    if (!mongoose.isValidObjectId(filters.hubId)) {
      return { error: 'Invalid hubId' as const };
    }
    clauses.push({
      $or: [{ hubId: { $exists: false } }, { hubId: null }, { hubId: asObjectId(filters.hubId) }],
    });
  }

  const classes = await ClassOffering.find(clauses.length === 1 ? clauses[0] : { $and: clauses })
    .select('_id name code description schoolId hubId modality schedule status')
    .sort({ name: 1 })
    .lean();

  return { classes };
}

export async function createStudentRegistration(input: CreateRegistrationInput) {
  const school = await School.findOne({ _id: input.schoolId, status: 'active' });
  if (!school) {
    return { error: 'School not found or inactive', status: 404 as const };
  }

  const hub = await Hub.findOne({ _id: input.hubId, isActive: true });
  if (!hub) {
    return { error: 'Hub not found or inactive', status: 404 as const };
  }

  if (!hub.schoolId || String(hub.schoolId) !== String(school._id)) {
    return { error: 'That hub does not belong to the selected school', status: 400 as const };
  }

  const uniqueClassIds = [...new Set(input.classIds)];
  const classes = await ClassOffering.find({
    _id: { $in: uniqueClassIds },
    status: 'active',
  });

  if (classes.length !== uniqueClassIds.length) {
    return { error: 'One or more classes are missing or inactive', status: 400 as const };
  }

  const mismatched = classes.find((item) => {
    if (item.schoolId && String(item.schoolId) !== String(school._id)) return true;
    if (item.hubId && String(item.hubId) !== String(hub._id)) return true;
    return false;
  });
  if (mismatched) {
    return { error: 'One or more classes are not offered at the selected school or hub', status: 400 as const };
  }

  const registration = await StudentRegistration.create({
    studentInfo: input.studentInfo,
    userId: input.userId || undefined,
    selectedSchool: school._id,
    selectedHub: hub._id,
    interestedClasses: classes.map((item) => item._id),
    status: 'pending',
    notes: input.notes,
  });

  if (input.userId) {
    await User.findByIdAndUpdate(input.userId, {
      schoolInterest: school.name,
      closestHub: {
        name: hub.name,
        address: hub.location,
      },
    });
  }

  return {
    registration: await StudentRegistration.findById(registration._id)
      .populate('selectedSchool', 'name slug code')
      .populate('selectedHub', 'name location')
      .populate('interestedClasses', 'name code modality')
      .lean(),
  };
}
