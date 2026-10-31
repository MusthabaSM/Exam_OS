import { z } from 'zod';
import { cuidSchema } from './common';

export const createConversationSchema = z.object({
  examId: cuidSchema.optional().nullable(),
  title: z.string().trim().min(1, 'Conversation title is required').max(150),
});

export const sendMessageSchema = z.object({
  conversationId: cuidSchema,
  content: z.string().trim().min(1, 'Message cannot be empty').max(4000, 'Message is too long'),
});

export const deleteConversationSchema = z.object({
  id: cuidSchema,
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
