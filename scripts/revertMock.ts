import prisma from '../src/lib/db/prisma';
import { DocumentStatus } from '@prisma/client';

async function revertMock() {
  const docId = 'cmt2y1zv8000apkw0lnfka7ja';
  
  await prisma.documentPage.deleteMany({ where: { documentId: docId } });
  await prisma.document.update({
    where: { id: docId },
    data: { status: DocumentStatus.FAILED }
  });
  
  console.log('Reverted to FAILED');
}

revertMock().catch(console.error).finally(() => prisma.$disconnect());
