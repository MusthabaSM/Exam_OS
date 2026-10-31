'use server';

import { getCurrentUserId } from '@/lib/auth';
import { examRepository } from '@/lib/repositories/examRepository';
import { ActionResponse, formatZodError } from '@/lib/validation/common';
import { createExamSchema, CreateExamInput, updateExamSchema, UpdateExamInput } from '@/lib/validation/examSchemas';
import { Exam } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function getExamsAction(includeArchived = false): Promise<ActionResponse<Exam[]>> {
  try {
    const userId = await getCurrentUserId();
    const exams = await examRepository.getExamsByUserId(userId, includeArchived);
    return { success: true, data: exams };
  } catch (error) {
    console.error('Error in getExamsAction:', error);
    return { success: false, error: 'Failed to fetch exams.' };
  }
}

export async function getExamByIdAction(id: string): Promise<ActionResponse<Exam>> {
  try {
    const userId = await getCurrentUserId();
    const exam = await examRepository.getExamById(id, userId);
    
    if (!exam) {
      return { success: false, error: 'Exam not found.' };
    }
    
    return { success: true, data: exam };
  } catch (error) {
    console.error('Error in getExamByIdAction:', error);
    return { success: false, error: 'Failed to fetch the exam.' };
  }
}

export async function createExamAction(input: unknown): Promise<ActionResponse<Exam>> {
  try {
    const userId = await getCurrentUserId();
    
    // Validate input using Zod
    const parsed = createExamSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    // Pass valid data to repository
    const exam = await examRepository.createExam(userId, parsed.data);
    
    revalidatePath('/exams');
    return { success: true, data: exam };
  } catch (error) {
    console.error('Error in createExamAction:', error);
    return { success: false, error: 'Failed to create exam.' };
  }
}

export async function updateExamAction(input: unknown): Promise<ActionResponse<Exam>> {
  try {
    const userId = await getCurrentUserId();
    
    // Validate input using Zod
    const parsed = updateExamSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const { id, ...data } = parsed.data;

    // Pass valid data to repository
    const exam = await examRepository.updateExam(id, userId, data);
    
    revalidatePath('/exams');
    revalidatePath(`/exams/${id}`);
    
    return { success: true, data: exam };
  } catch (error) {
    console.error('Error in updateExamAction:', error);
    return { success: false, error: 'Failed to update exam.' };
  }
}

export async function archiveExamAction(id: string): Promise<ActionResponse<Exam>> {
  try {
    const userId = await getCurrentUserId();
    const exam = await examRepository.archiveExam(id, userId);
    
    revalidatePath('/exams');
    revalidatePath(`/exams/${id}`);
    
    return { success: true, data: exam };
  } catch (error) {
    console.error('Error in archiveExamAction:', error);
    return { success: false, error: 'Failed to archive exam.' };
  }
}

export async function deleteExamAction(id: string): Promise<ActionResponse<Exam>> {
  try {
    const userId = await getCurrentUserId();
    const exam = await examRepository.deleteExam(id, userId);
    
    revalidatePath('/exams');
    
    return { success: true, data: exam };
  } catch (error) {
    console.error('Error in deleteExamAction:', error);
    return { success: false, error: 'Failed to delete exam.' };
  }
}
