'use server';

import { getCurrentUserId } from '@/lib/auth';
import { calendarRepository, UnifiedCalendarEvent } from '@/lib/repositories/calendarRepository';
import { ActionResponse } from '@/lib/validation/common';

export async function getCalendarEventsAction(startISO: string, endISO: string): Promise<ActionResponse<UnifiedCalendarEvent[]>> {
  try {
    const userId = await getCurrentUserId();
    const startDate = new Date(startISO);
    const endDate = new Date(endISO);
    
    const events = await calendarRepository.getEvents(userId, startDate, endDate);
    
    return { success: true, data: events };
  } catch (error: unknown) {
    console.error('Error in getCalendarEventsAction:', error);
    return { success: false, error: 'Failed to fetch calendar events' };
  }
}
