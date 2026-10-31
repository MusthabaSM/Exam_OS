import React from "react";
import { notFound } from "next/navigation";
import { getExamByIdAction } from "@/actions/examActions";
import EditExamClient from "./EditExamClient";

export default async function EditExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  
  const response = await getExamByIdAction(examId);
  
  if (!response.success || !response.data) {
    notFound();
  }

  return <EditExamClient exam={response.data} />;
}
