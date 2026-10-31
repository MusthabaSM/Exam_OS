import React from "react";
import NotesClient from "./NotesClient";
import { getNotesAction } from "@/actions/noteActions";

export default async function NotesPage() {
  const result = await getNotesAction();
  const notes = result.success ? result.data : [];

  return <NotesClient initialNotes={notes} />;
}
