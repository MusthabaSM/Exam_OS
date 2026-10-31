'use server';

import { getCurrentUserId } from '@/lib/auth';
import { practiceRepository } from '@/lib/repositories/practiceRepository';
import { examRepository } from '@/lib/repositories/examRepository';
import { ActionResponse, formatZodError } from '@/lib/validation/common';
import {
  createPracticeQuestionSchema,
  startPracticeAttemptSchema,
  submitPracticeAnswerSchema,
} from '@/lib/validation/practiceSchemas';
import { PracticeAttempt, PracticeAnswer, PracticeQuestion } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { parseDocument, ParseInput } from '@/lib/question-import/parser';
import { ParsedQuestion } from '@/lib/question-import/types';
import prisma from '@/lib/db/prisma';

function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    console.error(`[Server Error] ${error.message}`);
    return `${defaultMessage} (${error.message})`;
  }
  return defaultMessage || 'An unexpected error occurred.';
}

export async function getPracticeQuestionsAction(
  examId: string, 
  subjectIds?: string[], 
  topicIds?: string[], 
  documentIds?: string[], 
  limit: number = 20
): Promise<ActionResponse<PracticeQuestion[]>> {
  try {
    const userId = await getCurrentUserId();
    
    // SECURITY: Verify exam ownership before fetching questions
    const exam = await examRepository.getExamById(examId, userId);
    if (!exam) {
      return { success: false, error: 'Unauthorized or exam not found.' };
    }
    
    const questions = await practiceRepository.getQuestionsForAttempt(examId, subjectIds, topicIds, documentIds, limit);
    
    // SECURITY: Explicitly map only allowed fields to the client, stripping answers
    const safeQuestions = questions.map(q => ({
      id: q.id,
      examId: q.examId,
      subjectId: q.subjectId,
      topicId: q.topicId,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
      sourceDocumentId: q.sourceDocumentId,
      sourcePageNumber: q.sourcePageNumber
    })) as PracticeQuestion[];
    
    return { success: true, data: safeQuestions };
  } catch (error: unknown) {
    console.error('Error in getPracticeQuestionsAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch questions.') };
  }
}

export async function createPracticeQuestionAction(input: unknown): Promise<ActionResponse<PracticeQuestion>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = createPracticeQuestionSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }
    
    // SECURITY: Verify exam ownership before creating questions
    const exam = await examRepository.getExamById(parsed.data.examId, userId);
    if (!exam) {
      return { success: false, error: 'Unauthorized or exam not found.' };
    }
    
    const question = await practiceRepository.createPracticeQuestion(parsed.data.examId, parsed.data);
    revalidatePath(`/exams/${parsed.data.examId}/practice`);
    return { success: true, data: question };
  } catch (error: unknown) {
    console.error('Error in createPracticeQuestionAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to create question.') };
  }
}

export async function startPracticeAttemptAction(input: unknown): Promise<ActionResponse<PracticeAttempt>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = startPracticeAttemptSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const attempt = await practiceRepository.startAttempt(userId, parsed.data.examId, parsed.data.questionIds);
    return { success: true, data: attempt };
  } catch (error: unknown) {
    console.error('Error in startPracticeAttemptAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to start practice attempt.') };
  }
}

export async function submitPracticeAnswerAction(input: unknown): Promise<ActionResponse<{ success: boolean; saved: boolean }>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = submitPracticeAnswerSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    await practiceRepository.submitAnswer(userId, parsed.data.attemptId, parsed.data);
    
    // SECURITY: Do not leak isCorrect during active test
    return { success: true, data: { success: true, saved: true } };
  } catch (error: unknown) {
    console.error('Error in submitPracticeAnswerAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to submit answer.') };
  }
}

export async function completePracticeAttemptAction(attemptId: string, examId: string): Promise<ActionResponse<PracticeAttempt>> {
  try {
    const userId = await getCurrentUserId();
    const attempt = await practiceRepository.completeAttempt(userId, attemptId);
    
    revalidatePath(`/exams/${examId}/practice`);
    revalidatePath(`/exams/${examId}/progress`);
    revalidatePath(`/`); // Dashboard
    
    return { success: true, data: attempt };
  } catch (error: unknown) {
    console.error('Error in completePracticeAttemptAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to complete attempt.') };
  }
}

export async function getPracticeAttemptsAction(examId: string): Promise<ActionResponse<PracticeAttempt[]>> {
  try {
    const userId = await getCurrentUserId();
    const attempts = await practiceRepository.getAttempts(userId, examId);
    return { success: true, data: attempts };
  } catch (error: unknown) {
    console.error('Error in getPracticeAttemptsAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch attempts.') };
  }
}

export async function getPracticeAttemptDetailsAction(attemptId: string): Promise<ActionResponse<any>> {
  try {
    const userId = await getCurrentUserId();
    const attempt = await practiceRepository.getAttemptDetails(userId, attemptId);
    
    if (!attempt) {
      return { success: false, error: 'Attempt not found' };
    }
    
    return { success: true, data: attempt };
  } catch (error: unknown) {
    console.error('Error in getPracticeAttemptDetailsAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch attempt details.') };
  }
}


export async function importQuestionsAction(
  examId: string,
  subjectId: string | null,
  topicId: string | null,
  questions: ParsedQuestion[]
): Promise<ActionResponse<{ imported: number, skipped: number }>> {
  try {
    const userId = await getCurrentUserId();
    
    const dbQuestions = questions.map(q => ({
      subjectId,
      topicId,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer!,
      explanation: q.explanation || null,
      sourceDocumentId: q.sourceDocumentId,
      sourcePage: q.sourcePageNumber
    }));
    
    const result = await practiceRepository.bulkInsertQuestions(userId, examId, dbQuestions);
    
    revalidatePath(`/exams/${examId}/practice`);
    return { success: true, data: { imported: result.imported, skipped: result.skipped } };
    
  } catch (error: unknown) {
    console.error('Error in importQuestionsAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to import questions.') };
  }
}

export async function importAndStartAttemptAction(
  examId: string,
  subjectId: string | null,
  topicId: string | null,
  questions: ParsedQuestion[]
): Promise<ActionResponse<{ attemptId: string, inserted: number, duplicates: number, available: number }>> {
  try {
    const userId = await getCurrentUserId();
    
    // 1. Bulk insert questions (returns inserted, skipped, and all matching question IDs)
    const dbQuestionsInput = questions.map(q => ({
      subjectId,
      topicId,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer!,
      explanation: q.explanation || null,
      sourceDocumentId: null, // User uploaded dynamically, not saved as a Document entity
      sourcePage: q.sourcePageNumber
    }));
    
    const result = await practiceRepository.bulkInsertQuestions(userId, examId, dbQuestionsInput);
    
    // 2. Start a Practice Attempt containing exactly the uploaded questions
    const attempt = await practiceRepository.startAttempt(userId, examId, result.allQuestionIds);
    
    revalidatePath(`/exams/${examId}/practice`);
    
    return { 
      success: true, 
      data: { 
        attemptId: attempt.id, 
        inserted: result.imported,
        duplicates: result.skipped,
        available: result.allQuestionIds.length
      } 
    };
    
  } catch (error: unknown) {
    console.error('Error in importAndStartAttemptAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to import and start test.') };
  }
}
