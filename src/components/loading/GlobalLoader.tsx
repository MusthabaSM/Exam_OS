'use client';

import React from 'react';
import { LemniscateBloom } from './LemniscateBloom';

interface GlobalLoaderProps {
  message?: string;
  size?: number | string;
}

export function GlobalLoader({ message, size = 180 }: GlobalLoaderProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center p-8 gap-6 w-full h-full min-h-[40vh]"
      role="status"
      aria-live="polite"
    >
      <div className="text-primary">
        <LemniscateBloom size={size} />
      </div>
      
      {message && (
        <p className="text-sm font-medium text-foreground-muted animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
