import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-border p-6 rounded-xl">
        <div className="space-y-2">
          <div className="h-8 bg-border rounded-md w-48"></div>
          <div className="h-4 bg-border/50 rounded-md w-72"></div>
        </div>
        <div className="h-10 bg-primary/20 rounded-lg w-40"></div>
      </div>

      {/* Upcoming Exams (3 cards) */}
      <div className="space-y-4">
        <div className="h-6 bg-border rounded-md w-40"></div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="h-5 bg-border rounded-md w-24"></div>
                <div className="h-6 bg-border/50 rounded-full w-12"></div>
              </div>
              <div className="h-4 bg-border/50 rounded-md w-32"></div>
              <div className="flex gap-2">
                <div className="h-2 flex-1 bg-border rounded-full"></div>
                <div className="h-2 flex-1 bg-border rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          {/* Today's Focus */}
          <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
            <div className="h-6 bg-border rounded-md w-40"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 p-3 bg-surface-elevated rounded-lg">
                  <div className="w-10 h-10 bg-border rounded-md shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-border rounded-md w-3/4"></div>
                    <div className="h-3 bg-border/50 rounded-md w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preparation Overview */}
          <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
            <div className="h-6 bg-border rounded-md w-48"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-surface-elevated rounded-lg p-4 space-y-2 text-center">
                  <div className="w-8 h-8 mx-auto bg-border rounded-full"></div>
                  <div className="h-6 bg-border rounded-md w-16 mx-auto"></div>
                  <div className="h-3 bg-border/50 rounded-md w-20 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          {/* Weak Areas */}
          <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
            <div className="h-6 bg-border rounded-md w-32"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 bg-border rounded-md w-24"></div>
                    <div className="h-4 bg-border/50 rounded-md w-10"></div>
                  </div>
                  <div className="h-2 w-full bg-border rounded-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Materials */}
          <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
            <div className="h-6 bg-border rounded-md w-36"></div>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="flex gap-3 p-3 bg-surface-elevated rounded-lg items-center">
                  <div className="w-8 h-8 bg-border rounded-md shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-border rounded-md w-3/4"></div>
                    <div className="h-3 bg-border/50 rounded-md w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
