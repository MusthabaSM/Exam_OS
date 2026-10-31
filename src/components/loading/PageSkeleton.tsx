import React from 'react';
import { GlobalLoader } from './GlobalLoader';

export function PageSkeleton({ title, message = "Loading..." }: { title?: string, message?: string }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 w-full max-w-6xl mx-auto p-4 sm:p-8">
      <header className="space-y-3">
        {title ? (
           <h1 className="text-3xl font-semibold -tracking-[0.02em] text-foreground">{title}</h1>
        ) : (
           <div className="h-9 w-48 bg-surface-elevated rounded-md animate-pulse"></div>
        )}
        <div className="h-4 w-96 max-w-full bg-surface border border-border rounded-md animate-pulse"></div>
      </header>

      <div className="min-h-[50vh] bg-surface border border-border rounded-xl shadow-sm relative overflow-hidden flex items-center justify-center">
        {/* Subtle background placeholder lines */}
        <div className="absolute inset-0 p-6 sm:p-8 flex flex-col gap-4 opacity-20 pointer-events-none">
           <div className="h-16 w-full bg-surface-elevated rounded-lg animate-pulse" />
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="h-40 bg-surface-elevated rounded-lg animate-pulse delay-75" />
              <div className="h-40 bg-surface-elevated rounded-lg animate-pulse delay-150 hidden sm:block" />
              <div className="h-40 bg-surface-elevated rounded-lg animate-pulse delay-200 hidden md:block" />
           </div>
           <div className="h-32 w-full bg-surface-elevated rounded-lg animate-pulse delay-300" />
        </div>
        
        {/* Central Loader */}
        <div className="relative z-10">
          <GlobalLoader message={message} />
        </div>
      </div>
    </div>
  );
}
