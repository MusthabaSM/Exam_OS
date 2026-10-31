import { Metadata } from 'next';
import { requireCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db/prisma';
import ResultClient from './ResultClient';

export const metadata: Metadata = {
  title: 'Practice Result | Exam OS',
  description: 'Detailed review of your practice attempt',
};

export default async function PracticeResultPage({
  params,
}: {
  params: Promise<{ examId: string; attemptId: string }>;
}) {
  const { examId, attemptId } = await params;
  const user = await requireCurrentUser();

  // Fetch the completed attempt with full question details
  const attempt = await prisma.practiceAttempt.findFirst({
    where: { 
      id: attemptId, 
      userId: user.id,
      examId: examId,
      completedAt: { not: null } // Only show results for COMPLETED attempts
    },
    include: {
      answers: {
        include: {
          question: {
            include: {
              sourceDocument: true // Fetch the source document name if available
            }
          }
        }
      }
    },
  });

  if (!attempt) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Practice Result</h1>
        <p className="text-gray-500 mt-1">
          Review your performance and original answer key.
        </p>
      </div>

      <ResultClient attempt={attempt} />
    </div>
  );
}
