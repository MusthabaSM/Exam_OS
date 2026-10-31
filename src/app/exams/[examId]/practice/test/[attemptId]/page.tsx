import React from 'react';
import { getPracticeAttemptDetailsAction } from '@/actions/practiceActions';
import { notFound } from 'next/navigation';
import ActiveTestClient from './ActiveTestClient';
import { getCurrentUserId } from '@/lib/auth';

export default async function ActiveTestPage({
  params
}: {
  params: Promise<{ examId: string; attemptId: string }>
}) {
  const { examId, attemptId } = await params;
  const userId = await getCurrentUserId();
  if (!userId) notFound();

  const res = await getPracticeAttemptDetailsAction(attemptId);
  
  if (!res.success || !res.data) {
    notFound();
  }

  const attempt = res.data;

  // If completed, redirect to result page
  if (attempt.completedAt) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold mb-4">This test is already completed</h2>
        <a href={`/exams/${examId}/practice/result/${attempt.id}`} className="text-blue-500 hover:underline">
          View Results
        </a>
      </div>
    );
  }

  // ActiveTestClient handles the entire active session
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-gray-500">Loading test environment...</div>}>
      <ActiveTestClient 
        examId={examId} 
        attempt={attempt} 
      />
    </React.Suspense>
  );
}
