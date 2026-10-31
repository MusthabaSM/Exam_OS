import React from "react";
import { notFound } from "next/navigation";
import ExamLayoutClient from "./ExamLayoutClient";
import { getExamByIdAction } from "@/actions/examActions";

export default async function ExamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  
  const response = await getExamByIdAction(examId);
  
  if (!response.success || !response.data) {
    notFound();
  }

  const exam = response.data;
  const stages = Array.isArray((exam as unknown as { examStages?: { name: string }[] }).examStages)
    ? (exam as unknown as { examStages: { name: string }[] }).examStages.map(s => s.name)
    : [];

  return (
    <ExamLayoutClient 
      examId={examId} 
      examName={exam.name} 
      org={exam.organization || "ORG"}
      stages={stages}
      examDetails={{
        examDate: exam.examDate,
        totalMarks: exam.totalMarks,
        applicationStartDate: exam.applicationStartDate,
        applicationEndDate: exam.applicationEndDate,
      }}
    >
      {children}
    </ExamLayoutClient>
  );
}
