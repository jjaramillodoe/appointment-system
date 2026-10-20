import School from '@/models/School';
import Hub from '@/models/Hub';
import ClassOffering from '@/models/ClassOffering';

const SCHOOL_FIXTURES = Array.from({ length: 8 }, (_, index) => {
  const number = index + 1;
  return {
    name: `School ${number}`,
    slug: `school-${number}`,
    code: `SCH${number}`,
    status: 'active' as const,
    email: `school${number}@schools.nyc.gov`,
    phone: `718-555-010${number}`,
  };
});

const EXTRA_HUBS = [
  { schoolSlug: 'school-6', name: 'School 6 Learning Center', location: '450 Livonia Avenue, Brooklyn, NY 11207' },
  { schoolSlug: 'school-7', name: 'School 7 Adult Education Site', location: '910 Gates Avenue, Brooklyn, NY 11221' },
  { schoolSlug: 'school-8', name: 'School 8 Community Campus', location: '200 West 135th Street, New York, NY 10030' },
];

const CLASS_FIXTURES = [
  { name: 'English as a Second Language', code: 'ESL', modality: 'in-person' as const, schedule: 'Morning and evening', description: 'Beginning through advanced English for speakers of other languages.' },
  { name: 'Adult Basic Education', code: 'ABE', modality: 'in-person' as const, schedule: 'Morning', description: 'Reading, writing, and math for adult learners.' },
  { name: 'HSE / GED Preparation', code: 'HSE', modality: 'hybrid' as const, schedule: 'Evening', description: 'High school equivalency preparation in English or Spanish.' },
  { name: 'Career and Technical Education', code: 'CTE', modality: 'in-person' as const, schedule: 'Saturday', description: 'Job-readiness and career training pathways.' },
  { name: 'Digital Literacy', code: 'DIG', modality: 'hybrid' as const, schedule: 'Evening', description: 'Computer skills for work, school, and daily life.' },
  { name: 'Citizenship Preparation', code: 'CIT', modality: 'online' as const, schedule: 'Saturday', description: 'Civics and English practice for the naturalization interview.' },
];

export async function seedEnrollmentCatalog() {
  const schools = [];
  for (const fixture of SCHOOL_FIXTURES) {
    const school = await School.findOneAndUpdate(
      { slug: fixture.slug },
      { $set: fixture },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    schools.push(school);
  }

  const existingHubs = await Hub.find({}).sort({ name: 1 });
  const unassigned = existingHubs.filter((hub) => !hub.schoolId);
  for (let i = 0; i < unassigned.length; i += 1) {
    const school = schools[i % schools.length];
    unassigned[i].schoolId = school._id;
    await unassigned[i].save();
  }

  for (const extra of EXTRA_HUBS) {
    const school = schools.find((item) => item.slug === extra.schoolSlug);
    if (!school) continue;
    await Hub.findOneAndUpdate(
      { name: extra.name },
      {
        $set: {
          name: extra.name,
          location: extra.location,
          schoolId: school._id,
          timezone: 'America/New_York',
          isActive: true,
        },
        $setOnInsert: {
          defaultSlots: ['09:00', '10:00', '11:00', '17:00', '18:00'],
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  const classes = [];
  for (const fixture of CLASS_FIXTURES) {
    const created = await ClassOffering.findOneAndUpdate(
      { code: fixture.code },
      { $set: { ...fixture, status: 'active' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    classes.push(created);
  }

  return {
    schools: schools.length,
    hubs: await Hub.countDocuments({ schoolId: { $exists: true, $ne: null } }),
    classes: classes.length,
  };
}
