import prisma from '@/lib/db/prisma';
import { DocumentStatus } from '@prisma/client';

export const documentProcessingService = {
  async processDocument(documentId: string, userId: string, signedUrl?: string) {
    // 1. Verify ownership and get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { exam: true },
    });

    if (!document) throw new Error('Document not found');
    if (document.exam.userId !== userId) throw new Error('Unauthorized');
    if (!document.storageKey) throw new Error('Document has no storage key');

    // Update status to PROCESSING
    await prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.PROCESSING },
    });

    try {
      // 6. Mark as processed immediately since we don't need to extract text for RAG
      await prisma.document.update({
        where: { id: documentId },
        data: { 
          status: DocumentStatus.PROCESSED,
          processedAt: new Date()
        },
      });

    } catch (error: any) {
      console.error('Processing error:', error);
      require('fs').appendFileSync('error.log', new Date().toISOString() + ' - ' + error.message + '\n' + (error.stack || '') + '\n');
      await prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.FAILED },
      });
      throw error;
    }
  }
};
