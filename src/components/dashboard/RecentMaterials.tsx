"use client";

import React from "react";
import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  return `${Math.floor(months / 12)} years ago`;
}

export function RecentMaterials({ materials = [] }: { materials?: { id: string, examId?: string, name: string, documentType?: string, createdAt?: string }[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium -tracking-[0.01em] text-foreground">Recent Materials</h2>
      
      {materials.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 bg-surface border border-border border-dashed rounded-lg text-center space-y-2">
          <p className="text-sm text-foreground-muted">No materials uploaded yet.</p>
          <Link href="/exams" className="text-xs font-semibold text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors">
            Go to Exams
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {materials.map((doc) => (
            <Link key={doc.id} href={doc.examId ? `/exams/${doc.examId}/materials/${doc.id}` : `/materials/${doc.id}`} className="flex items-center justify-between py-2.5 px-3 hover:bg-surface-hover rounded-md transition-colors duration-150 ease-out group cursor-pointer border border-transparent hover:border-border">
              <div className="flex items-start gap-3 overflow-hidden">
                <div className="mt-0.5 shrink-0">
                  <FileText className="w-4 h-4 text-foreground-muted" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-foreground-muted">{doc.documentType?.replace('_', ' ') || 'OTHER'}</span>
                    <span className="text-xs text-border">•</span>
                    <span className="text-xs text-foreground-muted">
                      {doc.createdAt ? timeAgo(doc.createdAt) : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-1.5 text-foreground-muted hover:text-primary hover:bg-primary/10 rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                <ExternalLink className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
