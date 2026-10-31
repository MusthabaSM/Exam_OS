"use client";

import React from "react";
import { WeakAreas } from "@/components/dashboard/WeakAreas";
import Link from "next/link";
import { ArrowRight, BookOpen, LineChart } from "lucide-react";
import { motion } from "motion/react";

export default function GlobalProgressClient({ dashboardData }: { dashboardData: any }) {
  const { globalMetrics, upcomingExams } = dashboardData;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <LineChart className="w-8 h-8 text-primary" />
          Overall Progress
        </h1>
        <p className="text-foreground-muted mt-2">
          Your combined preparation metrics across all active exams.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-xl font-medium -tracking-[0.01em] text-foreground mb-6">Recent Activity Trend (Questions)</h2>
            <div className="h-48 flex items-end justify-between gap-2 border-b border-border pb-2">
              {globalMetrics?.recentActivity?.map((a: any, i: number) => {
                const maxActivity = Math.max(1, ...(globalMetrics.recentActivity?.map((act: any) => act.count) || [1]));
                const h = (a.count / maxActivity) * 100;
                return (
                  <div key={i} className="w-full bg-primary/20 hover:bg-primary/40 rounded-t transition-colors relative group" style={{ height: `${h || 2}%` }}>
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-medium px-2 py-1 rounded transition-opacity pointer-events-none z-10 whitespace-nowrap">
                      {a.count} Qs
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs font-medium text-foreground-muted mt-3">
              {globalMetrics?.recentActivity?.map((a: any, i: number) => (
                <span key={i}>{a.dayName}</span>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-xl font-medium -tracking-[0.01em] text-foreground mb-4">Exam Breakdown</h2>
            {upcomingExams && upcomingExams.length > 0 ? (
              <div className="space-y-4">
                {upcomingExams.map((exam: any) => (
                  <Link href={`/exams/${exam.id}/progress`} key={exam.id}>
                    <div className="group p-4 border border-border rounded-xl hover:border-primary/50 hover:bg-surface-hover transition-colors flex items-center justify-between cursor-pointer">
                      <div className="space-y-1">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">{exam.name}</h3>
                        <p className="text-xs text-foreground-muted">
                          {exam.organization || "No Org"} • {exam.progress}% Readiness
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-1.5 bg-surface-elevated rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${exam.progress}%` }} />
                        </div>
                        <ArrowRight className="w-4 h-4 text-foreground-muted group-hover:text-primary transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-sm text-foreground-muted py-8 text-center bg-surface-elevated rounded-lg">
                No active exams found. Create an exam to track progress.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 h-full">
            <WeakAreas areas={globalMetrics?.weakAreas || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
