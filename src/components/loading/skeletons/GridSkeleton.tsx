import React from "react";

export function GridSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <div className="h-8 bg-border rounded-md w-40"></div>
          <div className="h-4 bg-border/50 rounded-md w-64"></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 bg-primary/20 rounded-md w-32"></div>
        </div>
      </header>

      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:max-w-xs h-10 bg-surface border border-border rounded-md"></div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="h-10 bg-surface border border-border rounded-md w-24"></div>
          <div className="h-10 w-10 bg-surface border border-border rounded-md"></div>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 flex flex-col h-full min-h-[200px] space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-5 bg-border rounded-md w-32"></div>
                <div className="h-3 bg-border/50 rounded-md w-24"></div>
              </div>
              <div className="w-8 h-8 bg-border/50 rounded-lg"></div>
            </div>

            <div className="mt-auto space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 bg-border/50 rounded-md w-16"></div>
                  <div className="h-3 bg-border rounded-md w-8"></div>
                </div>
                <div className="h-1.5 w-full bg-border rounded-full"></div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-primary/10 rounded-full"></div>
                </div>
                <div className="h-4 bg-border/50 rounded-md w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
