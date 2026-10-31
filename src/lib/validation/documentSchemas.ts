import { z } from 'zod';
import { cuidSchema } from './common';
import { DocumentStatus, DocumentType } from '@prisma/client';

export const createDocumentSchema = z.object({
  examId: cuidSchema,
  name: z.string().trim().min(1, 'Document name is required').max(200),
  originalFilename: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  fileSize: z.number().int().min(0),
  documentType: z.nativeEnum(DocumentType).default(DocumentType.OTHER),
  storageKey: z.string().optional().nullable(),
  status: z.nativeEnum(DocumentStatus).default(DocumentStatus.UPLOADED),
});

export const updateDocumentSchema = createDocumentSchema.partial().extend({
  id: cuidSchema,
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
