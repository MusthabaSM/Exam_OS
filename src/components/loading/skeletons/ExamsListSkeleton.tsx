import React from "react";

export function ExamsListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <div className="h-8 bg-border rounded-md w-48"></div>
          <div className="h-4 bg-border/50 rounded-md w-64"></div>
        </div>
        <div className="h-10 bg-primary/20 rounded-md w-32"></div>
      </header>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:max-w-xs h-10 bg-surface border border-border rounded-md"></div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-8 bg-surface border border-border rounded-full w-16"></div>
          ))}
          <div className="h-8 w-8 bg-surface border border-border rounded-full shrink-0"></div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Exam Placeholder */}
        <div className="flex flex-col items-center justify-center p-5 bg-surface border-2 border-border border-dashed rounded-xl h-full min-h-[220px]">
          <div className="w-12 h-12 rounded-full bg-primary/10 mb-4"></div>
          <div className="h-5 bg-border rounded-md w-28 mb-2"></div>
          <div className="h-3 bg-border/50 rounded-md w-40"></div>
        </div>
        
        {/* Exam Cards */}
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 flex flex-col h-full min-h-[220px] space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="h-4 bg-primary/10 rounded w-12"></div>
                  <div className="h-4 bg-warning/20 rounded w-10"></div>
                </div>
                <div className="h-5 bg-border rounded-md w-32"></div>
                <div className="h-3 bg-border/50 rounded-md w-24"></div>
              </div>
              <div className="w-5 h-5 bg-border rounded-full"></div>
            </div>

            <div className="mt-auto space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary/40 rounded"></div>
                  <div className="h-6 bg-border rounded-md w-10"></div>
                  <div className="h-3 bg-border/50 rounded-md w-8"></div>
                </div>
                <div className="space-y-1 text-right flex flex-col items-end">
                  <div className="h-3 bg-border/50 rounded-md w-16"></div>
                  <div className="h-4 bg-border rounded-md w-20"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 bg-border/50 rounded-md w-20"></div>
                  <div className="h-3 bg-border rounded-md w-8"></div>
                </div>
                <div className="h-1.5 w-full bg-border rounded-full"></div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="h-3 bg-border/50 rounded-md w-24"></div>
                <div className="h-3 bg-border rounded-md w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
