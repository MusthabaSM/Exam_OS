import { z } from 'zod';
import { cuidSchema } from './common';

export const createNoteSchema = z.object({
  examId: cuidSchema.optional().nullable(),
  subjectId: cuidSchema.optional().nullable(),
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  // We do not strictly limit HTML structure here because Tiptap generates it.
  // We just ensure it's a string.
  content: z.string().trim().min(1, 'Content cannot be empty'),
});

export const updateNoteSchema = createNoteSchema.partial().extend({
  id: cuidSchema,
});

export const deleteNoteSchema = z.object({
  id: cuidSchema,
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
