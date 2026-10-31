"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, Target, Brain, MoveRight } from "lucide-react";

export function WeakAreas({ areas = [] }: { areas?: { id: string | number, topic: string, subject: string, accuracy: number }[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium -tracking-[0.01em] text-foreground">Needs Attention</h2>
      
      {areas.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 bg-surface border border-border border-dashed rounded-lg text-center space-y-2">
          <p className="text-sm text-foreground-muted">No weak areas identified yet.</p>
          <Link href="/practice" className="text-xs font-semibold text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors">
            Take a Practice Test
          </Link>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {areas.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-surface-hover transition-colors group gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-warning shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-foreground">{item.topic}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-foreground-muted">{item.subject}</p>
                      <span className="text-[10px] text-border">•</span>
                      <p className="text-xs font-semibold text-warning tabular-nums">{item.accuracy}% accuracy</p>
                    </div>
                  </div>
                </div>
                <Link href="/practice" className="flex items-center justify-between sm:justify-center gap-1.5 px-3 py-1.5 w-full sm:w-auto text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors">
                  Practice questions
                  <MoveRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
