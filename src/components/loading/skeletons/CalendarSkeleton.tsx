import React from "react";

export function CalendarSkeleton() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  return (
    <div className="space-y-6 animate-pulse">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <div className="h-8 bg-border rounded-md w-40"></div>
          <div className="h-4 bg-border/50 rounded-md w-64"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-[210px] bg-surface border border-border rounded-md"></div>
          <div className="h-10 w-20 bg-border/50 rounded-md"></div>
        </div>
      </header>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-surface-elevated">
          {days.map(d => (
            <div key={d} className="p-3 flex justify-center">
              <div className="h-4 bg-border/50 rounded w-8"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[120px] bg-border gap-px">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="bg-surface p-2 flex flex-col gap-2">
              <div className="w-6 h-6 rounded-full bg-border/50"></div>
              {/* Randomly mock some events */}
              {i % 5 === 0 && (
                <div className="h-4 bg-primary/20 rounded w-full mt-1"></div>
              )}
              {i % 8 === 0 && (
                <div className="h-4 bg-success/20 rounded w-3/4"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
