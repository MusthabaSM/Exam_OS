"use client";

import React from "react";
import { Activity, Target, Flame, BrainCircuit } from "lucide-react";

export function PreparationOverview({ metrics }: { metrics?: { readiness?: number, accuracy?: number, questionsSolved?: number, streak?: number } }) {
  const readiness = metrics?.readiness ?? 0;
  const accuracy = metrics?.accuracy ?? 0;
  const questions = metrics?.questionsSolved ?? 0;
  const streak = metrics?.streak ?? 0;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <h2 className="text-xl font-medium -tracking-[0.01em] text-foreground">Overview</h2>
      <div className="flex flex-col lg:flex-row gap-4 flex-1">
        {/* Primary Metric */}
        <div className="flex flex-col justify-center items-center sm:items-start text-center sm:text-left lg:w-2/5 px-2">
          <div className="flex items-center gap-2 text-foreground-muted mb-3">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Overall Preparation</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight text-foreground tabular-nums">{readiness}%</span>
            <span className="text-sm font-medium text-foreground-muted hidden sm:inline-block">readiness score</span>
          </div>
          <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden mt-4">
            <div className="h-full bg-primary rounded-full" style={{ width: `${readiness}%` }} />
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:w-3/5 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-4 mt-4 lg:mt-0">
          <div className="flex flex-col items-center sm:items-start justify-center px-2">
            <Target className="w-4 h-4 text-foreground-muted mb-2" />
            <div className="text-xl font-semibold tabular-nums text-foreground">{accuracy}%</div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted mt-1">Accuracy</span>
          </div>

          <div className="flex flex-col items-center sm:items-start justify-center px-2">
            <Flame className="w-4 h-4 text-warning mb-2" />
            <div className="text-xl font-semibold tabular-nums text-foreground">{streak}</div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted mt-1">Day Streak</span>
          </div>

          <div className="flex flex-col items-center sm:items-start justify-center px-2">
            <BrainCircuit className="w-4 h-4 text-foreground-muted mb-2" />
            <div className="text-xl font-semibold tabular-nums text-foreground">{questions >= 1000 ? (questions / 1000).toFixed(1) + 'k' : questions}</div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted mt-1">Questions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
