import { z } from 'zod';

export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Must be a valid id');

export const createRegistrationSchema = z.object({
  studentInfo: z.object({
    firstName: z.string().trim().min(1, 'First name is required'),
    lastName: z.string().trim().min(1, 'Last name is required'),
    email: z.string().trim().email('A valid email is required'),
    phone: z.string().trim().min(7, 'Phone is required'),
    preferredLanguage: z.string().trim().optional(),
  }),
  schoolId: objectIdSchema,
  hubId: objectIdSchema,
  classIds: z.array(objectIdSchema).min(1, 'Select at least one class'),
  userId: objectIdSchema.optional(),
  notes: z.string().trim().optional(),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;

export const upsertSchoolSchema = z.object({
  name: z.string().trim().min(1, 'School name is required'),
  slug: z.string().trim().optional(),
  code: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  website: z.string().trim().optional(),
});

export const upsertClassSchema = z.object({
  name: z.string().trim().min(1, 'Class name is required'),
  code: z.string().trim().optional(),
  description: z.string().trim().optional(),
  schoolId: z.union([objectIdSchema, z.literal('')]).optional(),
  hubId: z.union([objectIdSchema, z.literal('')]).optional(),
  modality: z.enum(['in-person', 'hybrid', 'online']).optional(),
  schedule: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
