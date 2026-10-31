import { z } from 'zod';
import { cuidSchema } from './common';
import { TaskStatus, Priority, SessionStatus } from '@prisma/client';

// -----------------------------------------------------------------------------
// STUDY TASK SCHEMAS
// -----------------------------------------------------------------------------

export const createStudyTaskSchema = z.object({
  examId: cuidSchema.optional().nullable(),
  subjectId: cuidSchema.optional().nullable(),
  topicId: cuidSchema.optional().nullable(),
  title: z.string().trim().min(1, 'Title is required').max(150, 'Title is too long'),
  description: z.string().trim().max(1000).optional().nullable(),
  scheduledDate: z.coerce.date().optional().nullable(),
  estimatedMinutes: z.number().int().min(1, 'Must be at least 1 minute').optional().nullable(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
});

export const updateStudyTaskSchema = createStudyTaskSchema.partial().extend({
  id: cuidSchema,
  actualMinutes: z.number().int().min(0).optional(),
});

export const completeStudyTaskSchema = z.object({
  id: cuidSchema,
  actualMinutes: z.number().int().min(0).optional(),
});

// -----------------------------------------------------------------------------
// STUDY SESSION SCHEMAS
// -----------------------------------------------------------------------------

export const startStudySessionSchema = z.object({
  examId: cuidSchema.optional().nullable(),
  studyTaskId: cuidSchema.optional().nullable(),
});

export const pauseStudySessionSchema = z.object({
  id: cuidSchema,
});

export const resumeStudySessionSchema = z.object({
  id: cuidSchema,
});

export const completeStudySessionSchema = z.object({
  id: cuidSchema,
});

export type CreateStudyTaskInput = z.infer<typeof createStudyTaskSchema>;
export type UpdateStudyTaskInput = z.infer<typeof updateStudyTaskSchema>;
