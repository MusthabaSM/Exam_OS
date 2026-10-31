import React from 'react';
import { getExamTopicWeightages } from './actions';
import TopicWeightageClient from './TopicWeightageClient';
import { notFound } from 'next/navigation';

export default async function TopicWeightagePage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  
  try {
    // force rebuild
    const data = await getExamTopicWeightages(examId);
    return (
      <div className="w-full">
        <TopicWeightageClient examId={examId} data={data} />
      </div>
    );
  } catch (err) {
    console.error(err);
    notFound();
  }
}
