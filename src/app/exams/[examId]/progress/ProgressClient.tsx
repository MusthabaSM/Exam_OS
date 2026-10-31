"use client";

import React from "react";
import { LineChart, BarChart2, Activity, Target } from "lucide-react";

type ProgressClientProps = {
  examId: string;
  metrics: {
    readiness: number;
    accuracy: string;
    questionsSolved: number;
    studyHours: number;
    totalTasks: number;
    completedTasks: number;
    subjectPerformance: { subject: string; score: number }[];
    recentActivity: { date: string; dayName: string; count: number }[];
  };
};

export default function ProgressClient({ examId, metrics }: ProgressClientProps) {
  // If no subject performance data is present, we show empty state
  const hasSubjectPerf = metrics.subjectPerformance.length > 0;
  
  // Calculate max activity for chart height scaling
  const maxActivity = Math.max(1, ...metrics.recentActivity.map(a => a.count));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium -tracking-[0.01em] text-foreground">Analytics & Progress</h2>
          <p className="text-sm text-foreground-muted mt-1">Track your performance across subjects and topics.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Overall Readiness", value: `${metrics.readiness}%`, icon: Activity, color: "text-primary" },
          { label: "Accuracy", value: `${metrics.accuracy}%`, icon: Target, color: "text-foreground" },
          { label: "Questions Solved", value: metrics.questionsSolved.toLocaleString(), icon: BarChart2, color: "text-foreground" },
          { label: "Study Hours", value: `${metrics.studyHours}h`, icon: LineChart, color: "text-foreground" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-surface border border-border p-4 rounded-xl shadow-sm">
              <Icon className={`w-5 h-5 mb-3 ${stat.color}`} />
              <div className="text-2xl font-bold tabular-nums text-foreground">{stat.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-6">Subject Performance</h3>
          <div className="space-y-5">
            {!hasSubjectPerf ? (
              <div className="text-sm text-foreground-muted text-center py-8">
                No practice data yet. Complete practice sessions to see your subject performance.
              </div>
            ) : (
              metrics.subjectPerformance.map(s => {
                const color = s.score >= 70 ? 'bg-success' : s.score >= 40 ? 'bg-warning' : 'bg-destructive';
                return (
                  <div key={s.subject} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-foreground">{s.subject}</span>
                      <span className="text-foreground-muted tabular-nums">{s.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${s.score}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold text-foreground mb-6">Recent Activity Trend (Questions)</h3>
          <div className="h-48 flex items-end justify-between gap-2 border-b border-border pb-2">
            {metrics.recentActivity.map((a, i) => {
              const h = (a.count / maxActivity) * 100;
              return (
                <div key={i} className="w-full bg-primary/20 hover:bg-primary/40 rounded-t transition-colors relative group" style={{ height: `${h || 2}%` }}>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-medium px-2 py-1 rounded transition-opacity">
                    {a.count} Qs
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs font-medium text-foreground-muted mt-3">
            {metrics.recentActivity.map((a, i) => (
              <span key={i}>{a.dayName}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
