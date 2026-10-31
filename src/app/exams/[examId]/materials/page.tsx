import React from "react";
import MaterialsClient from "./MaterialsClient";
import { getDocumentsAction } from "@/actions/documentActions";

export default async function MaterialsPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  
  const result = await getDocumentsAction(examId);
  const documents = result.success ? result.data : [];

  return <MaterialsClient examId={examId} initialDocuments={documents} />;
}
