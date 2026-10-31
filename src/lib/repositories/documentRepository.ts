import prisma from '../db/prisma';
import { Document, DocumentStatus, DocumentType } from '@prisma/client';
import { CreateDocumentInput, UpdateDocumentInput } from '../validation/documentSchemas';

export const documentRepository = {
  getDocumentsByExamId: async (examId: string, userId: string): Promise<Document[]> => {
    // Verify ownership
    const exam = await prisma.exam.findFirst({
      where: { id: examId, userId },
    });
    if (!exam) throw new Error('Unauthorized');

    return prisma.document.findMany({
      where: { examId },
      orderBy: { createdAt: 'desc' },
    });
  },

  getDocumentById: async (documentId: string, userId: string): Promise<Document | null> => {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { exam: true },
    });

    if (!document) return null;
    if (document.exam.userId !== userId) throw new Error('Unauthorized');

    return document;
  },

  createDocumentMetadata: async (userId: string, data: CreateDocumentInput): Promise<Document> => {
    const exam = await prisma.exam.findFirst({
      where: { id: data.examId, userId },
    });
    if (!exam) throw new Error('Unauthorized');

    return prisma.document.create({
      data: {
        examId: data.examId,
        name: data.name,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        documentType: data.documentType,
        storageKey: data.storageKey,
        status: data.status,
      },
    });
  },

  updateDocumentMetadata: async (userId: string, data: UpdateDocumentInput): Promise<Document> => {
    const document = await prisma.document.findUnique({
      where: { id: data.id },
      include: { exam: true },
    });

    if (!document) throw new Error('Document not found');
    if (document.exam.userId !== userId) throw new Error('Unauthorized');

    return prisma.document.update({
      where: { id: data.id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        documentType: data.documentType !== undefined ? data.documentType : undefined,
        status: data.status !== undefined ? data.status : undefined,
      },
    });
  },

  deleteDocument: async (userId: string, documentId: string): Promise<Document> => {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { exam: true },
    });

    if (!document) throw new Error('Document not found');
    if (document.exam.userId !== userId) throw new Error('Unauthorized');

    return prisma.document.delete({
      where: { id: documentId },
    });
  },

  searchDocumentsText: async (userId: string, query: string, documentId?: string) => {
    // Basic text search using Prisma contains
    const results = await prisma.documentChunk.findMany({
      where: {
        content: {
          contains: query,
          mode: 'insensitive'
        },
        document: {
          exam: {
            userId: userId
          },
          ...(documentId ? { id: documentId } : {})
        }
      },
      include: {
        document: true,
        page: true
      },
      take: 20
    });

    return results.map(chunk => ({
      documentId: chunk.documentId,
      documentName: chunk.document.name,
      pageNumber: chunk.page?.pageNumber || null,
      chunkIndex: chunk.chunkIndex,
      text: chunk.content
    }));
  }
};
