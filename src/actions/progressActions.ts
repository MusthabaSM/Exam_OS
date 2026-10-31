'use server';

import { getCurrentUserId } from '@/lib/auth';
import { progressRepository } from '@/lib/repositories/progressRepository';
import { ActionResponse } from '@/lib/validation/common';

function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) return error.message;
  return defaultMessage;
}

export async function getProgressMetricsAction(examId: string): Promise<ActionResponse<any>> {
  try {
    const userId = await getCurrentUserId();
    const metrics = await progressRepository.getProgressMetrics(examId, userId);
    return { success: true, data: metrics };
  } catch (error: unknown) {
    console.error('Error in getProgressMetricsAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch progress metrics.') };
  }
}
