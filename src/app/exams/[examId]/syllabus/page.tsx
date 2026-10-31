import React from "react";
import { notFound } from "next/navigation";
import { getSyllabusAction } from "@/actions/syllabusActions";
import SyllabusClient from "./SyllabusClient";

export default async function SyllabusPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  
  const response = await getSyllabusAction(examId);
  
  if (!response.success) {
    // Usually means unauthorized or failed to fetch
    notFound();
  }

  const subjects = response.data || [];

  return (
    <div className="w-full">
      <SyllabusClient examId={examId} initialSubjects={subjects} />
    </div>
  );
}
