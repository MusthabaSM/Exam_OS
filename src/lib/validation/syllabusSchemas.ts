import { z } from 'zod';
import { cuidSchema } from './common';
import { Difficulty, TopicStatus } from '@prisma/client';

// -----------------------------------------------------------------------------
// SUBJECT SCHEMAS
// -----------------------------------------------------------------------------

export const createSubjectSchema = z.object({
  examId: cuidSchema,
  name: z.string().trim().min(1, 'Subject name is required').max(150, 'Name is too long'),
  description: z.string().trim().max(1000).optional().nullable(),
  order: z.number().int().min(0).default(0),
});

export const updateSubjectSchema = createSubjectSchema.partial().extend({
  id: cuidSchema,
});

export const deleteSubjectSchema = z.object({
  id: cuidSchema,
});

// -----------------------------------------------------------------------------
// TOPIC SCHEMAS
// -----------------------------------------------------------------------------

export const createTopicSchema = z.object({
  subjectId: cuidSchema,
  parentTopicId: cuidSchema.optional().nullable(),
  name: z.string().trim().min(1, 'Topic name is required').max(150, 'Name is too long'),
  description: z.string().trim().max(1000).optional().nullable(),
  order: z.number().int().min(0).default(0),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
  estimatedStudyMinutes: z.number().int().min(0).optional().nullable(),
  status: z.nativeEnum(TopicStatus).default(TopicStatus.NOT_STARTED),
});

export const updateTopicSchema = createTopicSchema.partial().extend({
  id: cuidSchema,
});

export const deleteTopicSchema = z.object({
  id: cuidSchema,
});

export const reorderTopicSchema = z.object({
  id: cuidSchema,
  newOrder: z.number().int().min(0),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
