import React from "react";

export function NotesSkeleton() {
  return (
    <div className="h-[calc(100vh-4rem)] -m-4 md:-m-8 flex flex-col md:flex-row bg-surface animate-pulse">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-r border-border flex flex-col bg-surface shrink-0 h-1/3 md:h-full">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-7 bg-border rounded-md w-24"></div>
            <div className="w-8 h-8 bg-border rounded-md"></div>
          </div>
          <div className="h-10 bg-surface-elevated border border-border rounded-md w-full"></div>
        </div>
        <div className="flex-1 p-2 space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`p-3 rounded-lg border ${i === 1 ? 'bg-primary/10 border-primary/20' : 'border-transparent'}`}>
              <div className="h-5 bg-border rounded-md w-3/4 mb-2"></div>
              <div className="h-3 bg-border/50 rounded-md w-full mb-3"></div>
              <div className="flex gap-2">
                <div className="h-3 w-3 bg-border/50 rounded"></div>
                <div className="h-3 bg-border/50 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Main Area */}
      <div className="flex-1 flex flex-col h-2/3 md:h-full bg-background">
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4 bg-surface shrink-0">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-8 h-8 bg-border/50 rounded-md"></div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-border/50 rounded-md"></div>
            <div className="h-9 w-24 bg-primary/20 rounded-md"></div>
          </div>
        </div>
        <div className="flex-1 p-8 space-y-6">
          <div className="h-10 bg-border rounded-md w-1/3 mb-8"></div>
          
          <div className="space-y-3">
            <div className="h-4 bg-border/50 rounded-md w-full"></div>
            <div className="h-4 bg-border/50 rounded-md w-11/12"></div>
            <div className="h-4 bg-border/50 rounded-md w-full"></div>
            <div className="h-4 bg-border/50 rounded-md w-3/4"></div>
            <div className="h-4 bg-border/50 rounded-md w-5/6 mt-6"></div>
            <div className="h-4 bg-border/50 rounded-md w-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
