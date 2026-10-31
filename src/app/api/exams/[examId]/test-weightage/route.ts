import { getExamTopicWeightages } from '@/app/exams/[examId]/topic-weightage/actions';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ examId: string }> }) {
  try {
    const { examId } = await params;
    const data = await getExamTopicWeightages(examId);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
