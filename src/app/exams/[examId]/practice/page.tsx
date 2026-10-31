import React from "react";
import PracticeClient from "./PracticeClient";
import { getCurrentUserId } from "@/lib/auth";
import { getSyllabusAction } from "@/actions/syllabusActions";
import { getPracticeAttemptsAction } from "@/actions/practiceActions";
import { getDocumentsAction } from "@/actions/documentActions";
import { redirect } from "next/navigation";

export default async function PracticePage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  
  // Fetch subjects (which include topics via the action)
  const subjectsRes = await getSyllabusAction(examId);
  const subjects = subjectsRes.success ? subjectsRes.data : [];

  // Fetch previous attempts
  const attemptsRes = await getPracticeAttemptsAction(examId);
  const attempts = attemptsRes.success ? attemptsRes.data : [];

  // Fetch documents
  const documentsRes = await getDocumentsAction(examId);
  const documents = documentsRes.success ? documentsRes.data : [];

  return <PracticeClient examId={examId} subjects={subjects as any} previousAttempts={attempts as any} documents={documents as any} />;
}
