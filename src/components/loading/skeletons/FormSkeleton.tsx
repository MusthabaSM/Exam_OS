import React from "react";

export function FormSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
      {/* Header */}
      <header className="space-y-4">
        <div className="h-4 bg-border/50 rounded-md w-24 mb-4"></div>
        <div className="h-8 bg-border rounded-md w-64"></div>
        <div className="h-4 bg-border/50 rounded-md w-96"></div>
      </header>

      {/* Two Options */}
      <div className="grid sm:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="flex flex-col items-center text-center p-8 bg-surface border border-border rounded-xl h-64">
            <div className="w-16 h-16 rounded-full bg-border mb-6"></div>
            <div className="h-6 bg-border rounded-md w-40 mb-4"></div>
            <div className="space-y-2 w-full flex flex-col items-center">
              <div className="h-3 bg-border/50 rounded-md w-full"></div>
              <div className="h-3 bg-border/50 rounded-md w-5/6"></div>
              <div className="h-3 bg-border/50 rounded-md w-4/6"></div>
            </div>
            {i === 1 && (
              <div className="mt-6 h-5 bg-primary/10 rounded-md w-24"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
