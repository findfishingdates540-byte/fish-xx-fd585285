import { z } from 'zod';

// ── Shared field schemas ──────────────────────────────────────────

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s\-'.]+$/, 'Name contains invalid characters');

export const bioSchema = z
  .string()
  .trim()
  .max(500, 'Bio must be less than 500 characters')
  .optional()
  .or(z.literal(''));

export const emailFieldSchema = z
  .string()
  .trim()
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

export const messageContentSchema = z
  .string()
  .trim()
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message must be less than 2000 characters');

export const subjectSchema = z
  .string()
  .trim()
  .min(1, 'Subject is required')
  .max(200, 'Subject must be less than 200 characters');

export const citySchema = z
  .string()
  .trim()
  .max(100, 'City must be less than 100 characters')
  .optional()
  .or(z.literal(''));

export const stateSchema = z
  .string()
  .trim()
  .max(50, 'State must be less than 50 characters')
  .optional()
  .or(z.literal(''));

export const zipCodeSchema = z
  .string()
  .trim()
  .max(10, 'Zip code must be less than 10 characters')
  .regex(/^[0-9\-\s]*$/, 'Invalid zip code format')
  .optional()
  .or(z.literal(''));

// ── Composite form schemas ────────────────────────────────────────

export const contactFormSchema = z.object({
  name: displayNameSchema,
  email: emailFieldSchema,
  subject: subjectSchema,
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be less than 5000 characters'),
  category: z.string().min(1, 'Category is required'),
});

export const profileSchema = z.object({
  displayName: displayNameSchema,
  bio: bioSchema,
  city: citySchema,
  state: stateSchema,
  zipCode: zipCodeSchema,
  education: z.string().trim().max(100).optional().or(z.literal('')),
  occupation: z.string().trim().max(100).optional().or(z.literal('')),
});

export const tripSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  notes: z
    .string()
    .trim()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  baitDetails: z
    .string()
    .trim()
    .max(500, 'Bait details must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  coordinatesNotes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal('')),
  weatherNotes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal('')),
});

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type TripFormData = z.infer<typeof tripSchema>;
