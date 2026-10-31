import prisma from '../src/lib/db/prisma';
import { DocumentStatus } from '@prisma/client';

async function mockProcess() {
  const docId = 'cmt2yeb3l000bpkw0ju5odb5x';
  
  // Create dummy pages
  await prisma.documentPage.deleteMany({ where: { documentId: docId } });
  
  await prisma.documentPage.create({
    data: {
      documentId: docId,
      pageNumber: 1,
      text: `
Sample Question Paper
1. What is the capital of France?
A. London
B. Berlin
C. Paris
D. Madrid
Answer: C

2. Which planet is known as the Red Planet?
A. Venus
B. Mars
C. Jupiter
D. Saturn
Answer: B
      `
    }
  });

  // Mark as processed
  await prisma.document.update({
    where: { id: docId },
    data: { 
      status: DocumentStatus.PROCESSED,
      processedAt: new Date()
    }
  });
  
  console.log('Document mocked as PROCESSED');
}

mockProcess().catch(console.error).finally(() => prisma.$disconnect());
