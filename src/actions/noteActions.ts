'use server';

import { getCurrentUserId } from '@/lib/auth';
import { noteRepository } from '@/lib/repositories/noteRepository';
import { ActionResponse, formatZodError } from '@/lib/validation/common';
import {
  createNoteSchema,
  updateNoteSchema,
  deleteNoteSchema,
} from '@/lib/validation/noteSchemas';
import { Note } from '@prisma/client';
import { revalidatePath } from 'next/cache';

function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) return error.message;
  return defaultMessage;
}

export async function getNotesAction(): Promise<ActionResponse<Note[]>> {
  try {
    const userId = await getCurrentUserId();
    const notes = await noteRepository.getNotes(userId);
    return { success: true, data: notes };
  } catch (error: unknown) {
    console.error('Error in getNotesAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch notes.') };
  }
}

export async function getNotesByExamIdAction(examId: string): Promise<ActionResponse<Note[]>> {
  try {
    const userId = await getCurrentUserId();
    const notes = await noteRepository.getNotesByExamId(examId, userId);
    return { success: true, data: notes };
  } catch (error: unknown) {
    console.error('Error in getNotesByExamIdAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch notes.') };
  }
}

export async function getNoteByIdAction(noteId: string): Promise<ActionResponse<Note | null>> {
  try {
    const userId = await getCurrentUserId();
    const note = await noteRepository.getNoteById(noteId, userId);
    return { success: true, data: note };
  } catch (error: unknown) {
    console.error('Error in getNoteByIdAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch note.') };
  }
}

export async function createNoteAction(input: unknown): Promise<ActionResponse<Note>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = createNoteSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const note = await noteRepository.createNote(userId, parsed.data);
    revalidatePath(`/notes`);
    return { success: true, data: note };
  } catch (error: unknown) {
    console.error('Error in createNoteAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to create note.') };
  }
}

export async function updateNoteAction(input: unknown): Promise<ActionResponse<Note>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = updateNoteSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const note = await noteRepository.updateNote(userId, parsed.data);
    revalidatePath(`/notes`);
    return { success: true, data: note };
  } catch (error: unknown) {
    console.error('Error in updateNoteAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to update note.') };
  }
}

export async function deleteNoteAction(input: unknown): Promise<ActionResponse<Note>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = deleteNoteSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const note = await noteRepository.deleteNote(userId, parsed.data.id);
    revalidatePath(`/notes`);
    return { success: true, data: note };
  } catch (error: unknown) {
    console.error('Error in deleteNoteAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to delete note.') };
  }
}
