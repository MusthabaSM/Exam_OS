"use client";
import React from 'react';

export function DocumentCard({ title, type }: { title: string, type: string }) {
  return (
    <div className="group relative bg-surface border border-border p-5 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer">
      <div className="absolute top-3 right-3 bg-surface-hover text-foreground-muted text-xs font-semibold px-2 py-1 rounded-sm uppercase tracking-wider">
        {type}
      </div>
      <h3 className="font-medium text-foreground mt-2 mb-1">{title}</h3>
      <p className="text-sm text-foreground-muted">Uploaded today</p>
    </div>
  );
}
