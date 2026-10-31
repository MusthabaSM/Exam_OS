import React from "react";
import ImportClient from "./ImportClient";
import { requireCurrentUser } from "@/lib/auth";
import { getSyllabusAction } from "@/actions/syllabusActions";
import prisma from "@/lib/db/prisma";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Import Questions | Exam OS",
  description: "Import deterministic question banks",
};

export default async function ImportQuestionsPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const user = await requireCurrentUser();
  
  // Verify exam ownership
  const exam = await prisma.exam.findFirst({
     where: { id: examId, userId: user.id }
  });
  if (!exam) {
     return <div>DEBUG: Exam not found for user. ExamId: {examId}, UserId: {user.id}</div>;
  }

  // Fetch subjects (which include topics via the action)
  const subjectsRes = await getSyllabusAction(examId);
  const subjects = subjectsRes.success ? subjectsRes.data : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import Question Bank</h1>
        <p className="text-gray-500 mt-1">
          Upload a PDF or TXT file to extract multiple-choice questions automatically.
        </p>
      </div>

      <ImportClient examId={examId} subjects={subjects as any} />
    </div>
  );
}
