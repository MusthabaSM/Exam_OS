import React from "react";
import NotesClient from "@/app/notes/NotesClient";
import { getNotesByExamIdAction } from "@/actions/noteActions";

export default async function ExamNotesPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  
  const result = await getNotesByExamIdAction(examId);
  const notes = result.success ? result.data : [];

  return <NotesClient initialNotes={notes} examId={examId} />;
}
