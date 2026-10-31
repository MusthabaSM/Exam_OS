import { z } from 'zod';

export const updateSettingsSchema = z.object({
  appearance: z.enum(['light', 'dark', 'system']).optional(),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    studyReminders: z.boolean().default(true),
  }).optional(),
  preferences: z.object({
    defaultStudyDuration: z.number().int().min(5).max(300).default(60),
    weekStartsOn: z.enum(['monday', 'sunday']).default('monday'),
  }).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
