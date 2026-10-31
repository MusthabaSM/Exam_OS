'use server';

import { getCurrentUserId } from '@/lib/auth';
import { syllabusRepository } from '@/lib/repositories/syllabusRepository';
import { ActionResponse, formatZodError } from '@/lib/validation/common';
import {
  createSubjectSchema,
  updateSubjectSchema,
  deleteSubjectSchema,
  createTopicSchema,
  updateTopicSchema,
  deleteTopicSchema,
  reorderTopicSchema,
} from '@/lib/validation/syllabusSchemas';
import { Subject, Topic } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Include relations in type
export type SubjectWithTopics = Subject & { topics: Topic[] };

function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) return error.message;
  return defaultMessage;
}

export async function getSyllabusAction(examId: string): Promise<ActionResponse<SubjectWithTopics[]>> {
  try {
    const userId = await getCurrentUserId();
    const subjects = await syllabusRepository.getSubjectsByExamId(examId, userId);
    return { success: true, data: subjects };
  } catch (error: unknown) {
    console.error('Error in getSyllabusAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch syllabus.') };
  }
}

export async function createSubjectAction(input: unknown): Promise<ActionResponse<Subject>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = createSubjectSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const subject = await syllabusRepository.createSubject(userId, parsed.data);
    revalidatePath(`/exams/${parsed.data.examId}/syllabus`);
    return { success: true, data: subject };
  } catch (error: unknown) {
    console.error('Error in createSubjectAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to create subject.') };
  }
}

export async function updateSubjectAction(input: unknown, examId: string): Promise<ActionResponse<Subject>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = updateSubjectSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const { id, ...data } = parsed.data;
    if (!id) return { success: false, error: 'Subject ID is required' };

    const subject = await syllabusRepository.updateSubject(userId, id, data);
    revalidatePath(`/exams/${examId}/syllabus`);
    return { success: true, data: subject };
  } catch (error: unknown) {
    console.error('Error in updateSubjectAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to update subject.') };
  }
}

export async function deleteSubjectAction(id: string, examId: string): Promise<ActionResponse<Subject>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = deleteSubjectSchema.safeParse({ id });
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const subject = await syllabusRepository.deleteSubject(userId, parsed.data.id);
    revalidatePath(`/exams/${examId}/syllabus`);
    return { success: true, data: subject };
  } catch (error: unknown) {
    console.error('Error in deleteSubjectAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to delete subject.') };
  }
}

export async function createTopicAction(input: unknown, examId: string): Promise<ActionResponse<Topic>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = createTopicSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const topic = await syllabusRepository.createTopic(userId, parsed.data);
    revalidatePath(`/exams/${examId}/syllabus`);
    return { success: true, data: topic };
  } catch (error: unknown) {
    console.error('Error in createTopicAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to create topic.') };
  }
}

export async function updateTopicAction(input: unknown, examId: string): Promise<ActionResponse<Topic>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = updateTopicSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const { id, ...data } = parsed.data;
    if (!id) return { success: false, error: 'Topic ID is required' };

    const topic = await syllabusRepository.updateTopic(userId, id, data);
    revalidatePath(`/exams/${examId}/syllabus`);
    return { success: true, data: topic };
  } catch (error: unknown) {
    console.error('Error in updateTopicAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to update topic.') };
  }
}

export async function deleteTopicAction(id: string, examId: string): Promise<ActionResponse<Topic>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = deleteTopicSchema.safeParse({ id });
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const topic = await syllabusRepository.deleteTopic(userId, parsed.data.id);
    revalidatePath(`/exams/${examId}/syllabus`);
    return { success: true, data: topic };
  } catch (error: unknown) {
    console.error('Error in deleteTopicAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to delete topic.') };
  }
}

export async function reorderTopicsAction(subjectId: string, updates: { id: string; newOrder: number }[], examId: string): Promise<ActionResponse<void>> {
  try {
    const userId = await getCurrentUserId();
    
    // Validate updates
    const arraySchema = z.array(reorderTopicSchema);
    const parsed = arraySchema.safeParse(updates);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    await syllabusRepository.reorderTopics(userId, subjectId, parsed.data);
    revalidatePath(`/exams/${examId}/syllabus`);
    return { success: true, data: undefined };
  } catch (error: unknown) {
    console.error('Error in reorderTopicsAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to reorder topics.') };
  }
}

const bulkSyllabusSchema = z.object({
  examId: z.string(),
  parsedData: z.array(z.object({
    name: z.string(),
    topics: z.array(z.string()),
  })),
});

export async function bulkCreateSyllabusAction(input: unknown): Promise<ActionResponse<void>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = bulkSyllabusSchema.safeParse(input);
    
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    await syllabusRepository.bulkCreateSyllabus(userId, parsed.data.examId, parsed.data.parsedData);
    revalidatePath(`/exams/${parsed.data.examId}/syllabus`);
    
    return { success: true, data: undefined };
  } catch (error: unknown) {
    console.error('Error in bulkCreateSyllabusAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to bulk import syllabus.') };
  }
}

export async function deleteAllSubjectsAction(examId: string): Promise<ActionResponse<void>> {
  try {
    const userId = await getCurrentUserId();
    await syllabusRepository.deleteAllSubjects(userId, examId);
    revalidatePath(`/exams/${examId}/syllabus`);
    return { success: true, data: undefined };
  } catch (error: unknown) {
    console.error('Error in deleteAllSubjectsAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to clear syllabus.') };
  }
}
