'use server';

import { getCurrentUserId } from '@/lib/auth';
import { studyRepository } from '@/lib/repositories/studyRepository';
import { ActionResponse, formatZodError } from '@/lib/validation/common';
import {
  createStudyTaskSchema,
  updateStudyTaskSchema,
  startStudySessionSchema,
  pauseStudySessionSchema,
  resumeStudySessionSchema,
  completeStudySessionSchema,
} from '@/lib/validation/studySchemas';
import { StudyTask, StudySession, TaskStatus, Priority } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { parseScheduleText } from '@/lib/task-import/task-parser';
import prisma from '@/lib/db/prisma';

function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) return error.message;
  return defaultMessage;
}

export async function getGlobalStudyTasksAction(dateString?: string): Promise<ActionResponse<StudyTask[]>> {
  try {
    const userId = await getCurrentUserId();
    const tasks = await studyRepository.getGlobalStudyTasks(userId, dateString);
    return { success: true, data: tasks };
  } catch (error: unknown) {
    console.error('Error in getGlobalStudyTasksAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch global study tasks.') };
  }
}

export async function getGlobalActiveSessionAction(): Promise<ActionResponse<StudySession | null>> {
  try {
    const userId = await getCurrentUserId();
    const session = await studyRepository.getGlobalActiveSession(userId);
    return { success: true, data: session };
  } catch (error: unknown) {
    console.error('Error in getGlobalActiveSessionAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch global active session.') };
  }
}

export async function getStudyTasksAction(examId: string): Promise<ActionResponse<StudyTask[]>> {
  try {
    const userId = await getCurrentUserId();
    const tasks = await studyRepository.getStudyTasksByExamId(examId, userId);
    return { success: true, data: tasks };
  } catch (error: unknown) {
    console.error('Error in getStudyTasksAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch study tasks.') };
  }
}

export async function getActiveSessionAction(examId: string): Promise<ActionResponse<StudySession | null>> {
  try {
    const userId = await getCurrentUserId();
    const session = await studyRepository.getActiveSession(examId, userId);
    return { success: true, data: session };
  } catch (error: unknown) {
    console.error('Error in getActiveSessionAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch active session.') };
  }
}

export async function createStudyTaskAction(input: unknown): Promise<ActionResponse<StudyTask>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = createStudyTaskSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const task = await studyRepository.createStudyTask(userId, parsed.data);
    revalidatePath(`/study-plan`);
    return { success: true, data: task };
  } catch (error: unknown) {
    console.error('Error in createStudyTaskAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to create study task.') };
  }
}

export async function updateStudyTaskAction(input: unknown, examId: string): Promise<ActionResponse<StudyTask>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = updateStudyTaskSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const task = await studyRepository.updateStudyTask(userId, parsed.data);
    revalidatePath(`/study-plan`);
    return { success: true, data: task };
  } catch (error: unknown) {
    console.error('Error in updateStudyTaskAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to update study task.') };
  }
}

export async function deleteStudyTaskAction(id: string, examId: string): Promise<ActionResponse<StudyTask>> {
  try {
    const userId = await getCurrentUserId();
    const task = await studyRepository.deleteStudyTask(userId, id);
    revalidatePath(`/study-plan`);
    return { success: true, data: task };
  } catch (error: unknown) {
    console.error('Error in deleteStudyTaskAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to delete study task.') };
  }
}

export async function startStudySessionAction(input: unknown): Promise<ActionResponse<StudySession>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = startStudySessionSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const session = await studyRepository.startStudySession(userId, parsed.data.examId, parsed.data.studyTaskId || undefined);
    revalidatePath(`/study-plan`);
    return { success: true, data: session };
  } catch (error: unknown) {
    console.error('Error in startStudySessionAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to start session.') };
  }
}

export async function pauseStudySessionAction(input: unknown): Promise<ActionResponse<StudySession>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = pauseStudySessionSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const session = await studyRepository.pauseStudySession(userId, parsed.data.id);
    revalidatePath(`/study-plan`);
    return { success: true, data: session };
  } catch (error: unknown) {
    console.error('Error in pauseStudySessionAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to pause session.') };
  }
}

export async function resumeStudySessionAction(input: unknown): Promise<ActionResponse<StudySession>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = resumeStudySessionSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const session = await studyRepository.resumeStudySession(userId, parsed.data.id);
    revalidatePath(`/study-plan`);
    return { success: true, data: session };
  } catch (error: unknown) {
    console.error('Error in resumeStudySessionAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to resume session.') };
  }
}

export async function completeStudySessionAction(input: unknown): Promise<ActionResponse<StudySession>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = completeStudySessionSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const session = await studyRepository.completeStudySession(userId, parsed.data.id);
    revalidatePath(`/study-plan`);
    return { success: true, data: session };
  } catch (error: unknown) {
    console.error('Error in completeStudySessionAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to complete session.') };
  }
}

import { parseTableScheduleText, ParsedTableTask } from '@/lib/task-import/task-parser';

export async function previewStudyTasksPdfAction(formData: FormData): Promise<ActionResponse<{ 
  summary: string, 
  tasksToCreate: any[] 
}>> {
  try {
    const userId = await getCurrentUserId();
    
    const file = formData.get('file') as File;
    if (!file) return { success: false, error: 'No file provided' };

    const buffer = Buffer.from(await file.arrayBuffer());
    const { extractTextFromPDF } = await import("@/lib/pdf-extractor");
    const text = await extractTextFromPDF(buffer);

    const parsedTasks = parseTableScheduleText(text);
    if (parsedTasks.length === 0) {
      return { success: false, error: 'No tasks could be identified in the PDF.' };
    }

    // Fetch ALL topics across ALL user exams
    const allTopics = await prisma.topic.findMany({
      where: { subject: { exam: { userId } } },
      select: { id: true, name: true, subjectId: true, subject: { select: { name: true, examId: true } } }
    });

    const topicMatches = new Map<string, { topicId: string, subjectId: string, examId: string } | null>();
    const subjectMatches = new Map<string, { subjectId: string, examId: string } | null>();

    for (const topic of allTopics) {
      const normalizedTopic = topic.name.trim().toLowerCase();
      if (topicMatches.has(normalizedTopic)) {
        topicMatches.set(normalizedTopic, null); // Ambiguous across user account
      } else {
        topicMatches.set(normalizedTopic, { topicId: topic.id, subjectId: topic.subjectId, examId: topic.subject.examId });
      }

      const normalizedSubject = topic.subject.name.trim().toLowerCase();
      if (subjectMatches.has(normalizedSubject)) {
        subjectMatches.set(normalizedSubject, null);
      } else {
        subjectMatches.set(normalizedSubject, { subjectId: topic.subjectId, examId: topic.subject.examId });
      }
    }
    
    const existingTasks = await prisma.studyTask.findMany({
      where: { userId },
      select: { title: true, scheduledDate: true, topicId: true, subjectId: true, examId: true }
    });
    
    const existingSet = new Set(
      existingTasks.map(t => 
        // Duplicate key now includes exact ISO string to distinguish time slots
        `${userId}_${t.scheduledDate ? t.scheduledDate.toISOString() : 'null'}_${t.title.trim().toLowerCase()}_${t.topicId || 'null'}_${t.subjectId || 'null'}_${t.examId || 'null'}`
      )
    );

    const tasksToCreate = [];
    let skippedDuplicates = 0;
    let daysSet = new Set();
    
    for (const pt of parsedTasks) {
      daysSet.add(pt.date.toISOString().split('T')[0]);
      const normalizedTitle = pt.title.trim().toLowerCase();
      const normalizedDesc = pt.description.trim().toLowerCase();
      
      // Try mapping topic or subject
      // In PDF, the title is usually the Subject, and description is the Topic details.
      let matched = topicMatches.get(normalizedTitle) || topicMatches.get(normalizedDesc) || null;
      let matchedSubject = subjectMatches.get(normalizedTitle) || null;
      
      const examId = matched ? matched.examId : (matchedSubject ? matchedSubject.examId : null);
      const subjectId = matched ? matched.subjectId : (matchedSubject ? matchedSubject.subjectId : null);
      const topicId = matched ? matched.topicId : null;
      
      const key = `${userId}_${pt.date.toISOString()}_${normalizedTitle}_${topicId || 'null'}_${subjectId || 'null'}_${examId || 'null'}`;
      
      if (existingSet.has(key)) {
        skippedDuplicates++;
      } else {
        tasksToCreate.push({
          userId,
          examId,
          subjectId,
          topicId,
          title: pt.title,
          description: pt.description,
          scheduledDate: pt.date,
          estimatedMinutes: 90,
          status: TaskStatus.TODO,
          priority: Priority.MEDIUM,
        });
        existingSet.add(key);
      }
    }

    const totalParsed = parsedTasks.length;
    const summary = `Found ${totalParsed} study blocks across ${daysSet.size} days.\n${tasksToCreate.length} new tasks will be imported, skipping ${skippedDuplicates} duplicates.`;

    return { success: true, data: { summary, tasksToCreate } };
  } catch (error: unknown) {
    console.error('Error previewing PDF:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to parse PDF.') };
  }
}

export async function importStudyTasksAction(tasks: any[]): Promise<ActionResponse<{ importedCount: number }>> {
  try {
    const userId = await getCurrentUserId();
    
    // Safety check - force userId
    const safeTasks = tasks.map(t => ({
      ...t,
      userId,
      scheduledDate: new Date(t.scheduledDate)
    }));

    const result = await prisma.studyTask.createMany({
      data: safeTasks
    });

    revalidatePath('/study-plan');
    
    return { success: true, data: { importedCount: result.count } };
  } catch (error: unknown) {
    console.error('Error importing tasks:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to import tasks.') };
  }
}

