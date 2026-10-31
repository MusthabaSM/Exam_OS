import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import prisma from '../../src/lib/db/prisma';
import { documentRepository } from '../../src/lib/repositories/documentRepository';
import { DocumentStatus, DocumentType } from '@prisma/client';

describe('Document Repository', () => {
  let userId: string;
  let otherUserId: string;
  let examId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { email: `test-doc-${Date.now()}@example.com`, name: 'Test User' },
    });
    userId = user.id;

    const otherUser = await prisma.user.create({
      data: { email: `test-doc-other-${Date.now()}@example.com`, name: 'Other User' },
    });
    otherUserId = otherUser.id;

    const exam = await prisma.exam.create({
      data: {
        userId,
        name: 'Test Exam Doc',
        isDevelopment: true,
      },
    });
    examId = exam.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [userId, otherUserId] } }
    });
  });

  describe('Document CRUD', () => {
    it('creates a document metadata record', async () => {
      const doc = await documentRepository.createDocumentMetadata(userId, {
        examId,
        name: 'Test PDF',
        originalFilename: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        documentType: DocumentType.STUDY_MATERIAL,
        status: DocumentStatus.UPLOADED,
      });
      expect(doc.name).toBe('Test PDF');
      expect(doc.status).toBe(DocumentStatus.UPLOADED);
      expect(doc.examId).toBe(examId);
    });

    it('rejects document creation if user does not own exam', async () => {
      await expect(
        documentRepository.createDocumentMetadata(otherUserId, {
          examId,
          name: 'Test PDF',
          originalFilename: 'test.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024,
          documentType: DocumentType.STUDY_MATERIAL,
          status: DocumentStatus.UPLOADED,
        })
      ).rejects.toThrow('Unauthorized');
    });

    it('gets documents by exam id', async () => {
      await documentRepository.createDocumentMetadata(userId, {
        examId,
        name: 'Doc 1',
        originalFilename: 'd1.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        documentType: DocumentType.STUDY_MATERIAL,
        status: DocumentStatus.UPLOADED,
      });

      const docs = await documentRepository.getDocumentsByExamId(examId, userId);
      expect(docs.length).toBe(1);
      expect(docs[0].name).toBe('Doc 1');
    });

    it('rejects fetch if user does not own exam', async () => {
      await expect(
        documentRepository.getDocumentsByExamId(examId, otherUserId)
      ).rejects.toThrow('Unauthorized');
    });

    it('updates a document', async () => {
      const doc = await documentRepository.createDocumentMetadata(userId, {
        examId,
        name: 'Test PDF',
        originalFilename: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        documentType: DocumentType.STUDY_MATERIAL,
        status: DocumentStatus.UPLOADED,
      });

      const updated = await documentRepository.updateDocumentMetadata(userId, {
        id: doc.id,
        name: 'Updated PDF',
      });

      expect(updated.name).toBe('Updated PDF');
    });

    it('deletes a document', async () => {
      const doc = await documentRepository.createDocumentMetadata(userId, {
        examId,
        name: 'Test PDF',
        originalFilename: 'test.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        documentType: DocumentType.STUDY_MATERIAL,
        status: DocumentStatus.UPLOADED,
      });

      await documentRepository.deleteDocument(userId, doc.id);
      
      const found = await documentRepository.getDocumentById(doc.id, userId);
      expect(found).toBeNull();
    });
  });
});
