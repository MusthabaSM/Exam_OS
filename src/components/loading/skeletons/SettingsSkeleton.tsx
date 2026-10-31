import React from "react";

export function SettingsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
      {/* Header */}
      <header className="border-b border-border pb-6 flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-8 bg-border rounded-md w-32"></div>
          <div className="h-4 bg-border/50 rounded-md w-64"></div>
        </div>
        <div className="h-10 w-28 bg-red-50 border border-red-100 rounded-lg"></div>
      </header>

      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${i === 1 ? 'bg-surface-elevated' : ''}`}>
              <div className="w-4 h-4 bg-border/50 rounded"></div>
              <div className="h-4 bg-border/50 rounded w-24"></div>
            </div>
          ))}
        </div>

        {/* Main Settings Form */}
        <div className="md:col-span-3 space-y-8">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
            <div className="border-b border-border pb-4">
              <div className="h-6 bg-border rounded-md w-32"></div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-primary/20 shrink-0"></div>
              <div className="h-8 w-32 bg-surface-elevated border border-border rounded-md"></div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-border/50 rounded-md w-20"></div>
                <div className="h-10 bg-surface border border-border rounded-md w-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-border/50 rounded-md w-24"></div>
                <div className="h-10 bg-surface border border-border rounded-md w-full"></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 bg-border/50 rounded-md w-40"></div>
              <div className="h-10 bg-surface border border-border rounded-md w-[150px]"></div>
            </div>

            <div className="pt-4 flex justify-end">
              <div className="h-10 w-32 bg-primary/40 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
