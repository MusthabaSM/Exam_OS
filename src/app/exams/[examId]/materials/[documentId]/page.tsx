import React from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { PdfViewerDynamic } from '@/components/documents/PdfViewerDynamic';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function DocumentViewerPage({
  params,
}: {
  params: Promise<{ examId: string; documentId: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return notFound();
  }

  const { examId, documentId } = await params;

  const document = await prisma.document.findUnique({
    where: { id: documentId, examId },
    include: { exam: true },
  });

  if (!document || document.exam.userId !== userId) {
    return notFound();
  }

  const documentUrl = `/api/documents/${document.id}/download`;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" render={<Link href={`/exams/${examId}/materials`} />} nativeButton={false} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground truncate">{document.name}</h1>
          <p className="text-sm text-foreground-muted truncate">
            {document.originalFilename} • {(document.fileSize / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {document.mimeType === 'application/pdf' || document.originalFilename.toLowerCase().endsWith('.pdf') ? (
          <PdfViewerDynamic url={documentUrl} title={document.name} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-surface border border-border rounded-xl">
            <p className="text-foreground-muted mb-4">This document type cannot be previewed.</p>
            <Button render={<a href={documentUrl} target="_blank" rel="noopener noreferrer" />} nativeButton={false}>
              Download File
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
