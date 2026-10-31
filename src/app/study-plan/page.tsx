import React from "react";
import GlobalStudyPlanClient from "./GlobalStudyPlanClient";
import { getGlobalStudyTasksAction, getGlobalActiveSessionAction } from "@/actions/studyActions";
import { StudyTask, StudySession } from "@prisma/client";

export type GlobalStudyTask = StudyTask & {
  exam?: { name: string } | null;
  subject?: { name: string } | null;
  topic?: { name: string } | null;
};

export default async function GlobalStudyPlanPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const selectedDate = params?.date as string | undefined;

  const result = await getGlobalStudyTasksAction(selectedDate);
  const tasks = result.success ? (result.data as GlobalStudyTask[]) : [];

  const sessionResult = await getGlobalActiveSessionAction();
  const activeSession = sessionResult.success ? sessionResult.data : null;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Global Study Plan</h1>
        <p className="text-foreground-muted mt-2">Manage and track your daily study tasks across all your exams.</p>
      </div>
      <React.Suspense fallback={<div>Loading...</div>}>
        <GlobalStudyPlanClient initialTasks={tasks} initialActiveSession={activeSession} selectedDateStr={selectedDate} />
      </React.Suspense>
    </div>
  );
}
