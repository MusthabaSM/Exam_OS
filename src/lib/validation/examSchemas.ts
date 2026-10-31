import { z } from 'zod';
import { cuidSchema } from './common';
import { ExamStatus } from '@prisma/client';

export const examStageSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Stage name is required').max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  order: z.number().int().min(0).optional(),
});

export const createExamBaseSchema = z.object({
  name: z.string().trim().min(1, 'Exam name is required').max(150, 'Name is too long'),
  organization: z.string().trim().max(100).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  notificationDate: z.coerce.date().optional().nullable(),
  applicationStartDate: z.coerce.date().optional().nullable(),
  applicationEndDate: z.coerce.date().optional().nullable(),
  prelimsDate: z.coerce.date().optional().nullable(), // Legacy
  mainsDate: z.coerce.date().optional().nullable(), // Legacy
  examDate: z.coerce.date().optional().nullable(),
  officialWebsite: z
    .string()
    .trim()
    .url('Invalid URL format')
    .optional()
    .nullable()
    .or(z.literal('')),
  totalMarks: z.coerce.number().int().min(1).optional().nullable(),
  minimumQualifyingMarks: z.string().trim().max(100).optional().nullable(),
  weightageDistribution: z.record(z.string(), z.string()).optional().nullable(),
  status: z.nativeEnum(ExamStatus).default(ExamStatus.UPCOMING),
  isDevelopment: z.boolean().default(false).optional(),
  stages: z.array(examStageSchema).optional(),
});

export const createExamSchema = createExamBaseSchema.refine(
  (data) => {
    if (data.applicationStartDate && data.applicationEndDate) {
      return data.applicationEndDate >= data.applicationStartDate;
    }
    return true;
  },
  {
    message: 'Application end date cannot precede application start date',
    path: ['applicationEndDate'],
  }
);

export const updateExamSchema = createExamBaseSchema.partial().extend({
  id: cuidSchema,
}).refine(
  (data) => {
    if (data.applicationStartDate && data.applicationEndDate) {
      return data.applicationEndDate >= data.applicationStartDate;
    }
    return true;
  },
  {
    message: 'Application end date cannot precede application start date',
    path: ['applicationEndDate'],
  }
);

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
