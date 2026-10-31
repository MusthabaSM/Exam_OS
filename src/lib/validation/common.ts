import { z } from 'zod';

// CUIDs are typically 25 characters, starting with 'c'
export const cuidSchema = z
  .string()
  .cuid('Invalid ID format');

// A generic pagination schema for list endpoints
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// A standard Server Action response format
export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// Helper to format Zod errors into our standardized ActionResponse
export function formatZodError(error: z.ZodError): ActionResponse<never> {
  return {
    success: false,
    error: 'Validation failed',
    fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
  };
}
