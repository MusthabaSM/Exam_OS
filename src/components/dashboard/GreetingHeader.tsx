import React from "react";
import { Play, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";

export function GreetingHeader({ userName = "Student", nextTask }: { userName?: string; nextTask?: { examId?: string, topic?: { name: string }, title?: string, subject?: { name: string } } }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold -tracking-[0.02em] text-foreground">
          Good morning, {userName}.
        </h1>
        <p className="text-foreground-muted font-medium">
          {today}
        </p>
      </div>
      
      {nextTask ? (
        <Link href={`/study-plan`} className="flex flex-col items-start justify-center px-5 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 hover:scale-[1.01] transition-all duration-150 ease-out shrink-0 text-left min-w-[240px]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground/80 mb-0.5">
            <Play className="w-3.5 h-3.5 fill-current" />
            Continue Studying
          </div>
          <div className="text-sm font-medium">
            {nextTask.topic?.name || nextTask.title} · {nextTask.subject?.name || 'General'}
          </div>
        </Link>
      ) : (
        <Link href="/exams" className="flex flex-col items-start justify-center px-5 py-2 bg-surface text-foreground border border-border rounded-md shadow-sm hover:bg-surface-hover hover:scale-[1.01] transition-all duration-150 ease-out shrink-0 text-left min-w-[240px]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-0.5">
            <CalendarIcon className="w-3.5 h-3.5" />
            Plan Your Study
          </div>
          <div className="text-sm font-medium">
            No upcoming tasks scheduled
          </div>
        </Link>
      )}
    </div>
  );
}
