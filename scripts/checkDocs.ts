import { config } from 'dotenv';
config({ path: '.env' });
import prisma from '../src/lib/db/prisma';

async function main() {
  const docs = await prisma.document.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      examId: true,
      updatedAt: true
    },
    orderBy: { updatedAt: 'desc' }
  });
  console.log("Documents in DB:");
  console.table(docs);
}

main().catch(console.error).finally(() => prisma.$disconnect());
