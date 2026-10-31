import { z } from 'zod';
import { cuidSchema } from './common';
import { EventType } from '@prisma/client';

export const createCalendarEventBaseSchema = z.object({
  examId: cuidSchema.optional().nullable(),
  title: z.string().trim().min(1, 'Event title is required').max(150),
  description: z.string().trim().max(1000).optional().nullable(),
  startAt: z.coerce.date({ error: 'Start date is required' }),
  endAt: z.coerce.date({ error: 'End date is required' }),
  type: z.nativeEnum(EventType).default(EventType.OTHER),
});

export const createCalendarEventSchema = createCalendarEventBaseSchema.refine(
  (data) => data.endAt >= data.startAt,
  {
    message: 'End date cannot be before start date',
    path: ['endAt'],
  }
);

export const updateCalendarEventSchema = createCalendarEventBaseSchema.partial().extend({
  id: cuidSchema,
}).refine(
  (data) => {
    if (data.startAt && data.endAt) {
      return data.endAt >= data.startAt;
    }
    return true;
  },
  {
    message: 'End date cannot be before start date',
    path: ['endAt'],
  }
);

export const deleteCalendarEventSchema = z.object({
  id: cuidSchema,
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;
