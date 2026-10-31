'use server';

import { getCurrentUserId } from '@/lib/auth';
import { documentRepository } from '@/lib/repositories/documentRepository';
import { ActionResponse, formatZodError } from '@/lib/validation/common';
import {
  createDocumentSchema,
  updateDocumentSchema,
} from '@/lib/validation/documentSchemas';
import { Document } from '@prisma/client';
import { revalidatePath } from 'next/cache';

function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) return error.message;
  return defaultMessage;
}

export async function getDocumentsAction(examId: string): Promise<ActionResponse<Document[]>> {
  try {
    const userId = await getCurrentUserId();
    const documents = await documentRepository.getDocumentsByExamId(examId, userId);
    return { success: true, data: documents };
  } catch (error: unknown) {
    console.error('Error in getDocumentsAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch documents.') };
  }
}

export async function getDocumentByIdAction(documentId: string): Promise<ActionResponse<Document | null>> {
  try {
    const userId = await getCurrentUserId();
    const document = await documentRepository.getDocumentById(documentId, userId);
    return { success: true, data: document };
  } catch (error: unknown) {
    console.error('Error in getDocumentByIdAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to fetch document.') };
  }
}

export async function createDocumentAction(input: unknown): Promise<ActionResponse<Document>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = createDocumentSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const document = await documentRepository.createDocumentMetadata(userId, parsed.data);
    revalidatePath(`/exams/${parsed.data.examId}/materials`);
    return { success: true, data: document };
  } catch (error: unknown) {
    console.error('Error in createDocumentAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to create document.') };
  }
}

export async function updateDocumentAction(input: unknown, examId: string): Promise<ActionResponse<Document>> {
  try {
    const userId = await getCurrentUserId();
    const parsed = updateDocumentSchema.safeParse(input);
    if (!parsed.success) {
      return formatZodError(parsed.error);
    }

    const document = await documentRepository.updateDocumentMetadata(userId, parsed.data);
    revalidatePath(`/exams/${examId}/materials`);
    revalidatePath(`/materials/${document.id}`);
    return { success: true, data: document };
  } catch (error: unknown) {
    console.error('Error in updateDocumentAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to update document.') };
  }
}

export async function deleteDocumentAction(id: string, examId: string): Promise<ActionResponse<Document>> {
  try {
    const userId = await getCurrentUserId();
    const document = await documentRepository.deleteDocument(userId, id);
    revalidatePath(`/exams/${examId}/materials`);
    return { success: true, data: document };
  } catch (error: unknown) {
    console.error('Error in deleteDocumentAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to delete document.') };
  }
}

export async function searchDocumentsTextAction(query: string, documentId?: string): Promise<ActionResponse<any[]>> {
  try {
    const userId = await getCurrentUserId();
    if (!query.trim()) return { success: true, data: [] };
    const results = await documentRepository.searchDocumentsText(userId, query, documentId);
    return { success: true, data: results };
  } catch (error: unknown) {
    console.error('Error in searchDocumentsTextAction:', error);
    return { success: false, error: getErrorMessage(error, 'Failed to search documents.') };
  }
}
