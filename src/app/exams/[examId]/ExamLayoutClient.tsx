"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Clock, Calendar, BookOpen, PenTool, LineChart, FileText, StickyNote, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TABS = [
  { name: "Overview", href: "", icon: Clock },
  { name: "Syllabus", href: "/syllabus", icon: BookOpen },
  { name: "Topic Weightage", href: "/topic-weightage", icon: BarChart2 },
  { name: "Materials", href: "/materials", icon: FileText },
  { name: "Practice", href: "/practice", icon: PenTool },
  { name: "Progress", href: "/progress", icon: LineChart },
  { name: "Notes", href: "/notes", icon: StickyNote },
];

export default function ExamLayoutClient({
  children,
  examId,
  examName,
  org,
  stages,
  examDetails,
}: {
  children: React.ReactNode;
  examId: string;
  examName: string;
  org: string;
  stages?: string[];
  examDetails?: {
    examDate?: Date | null;
    totalMarks?: number | null;
    applicationStartDate?: Date | null;
    applicationEndDate?: Date | null;
  };
}) {
  const pathname = usePathname();
  const basePath = `/exams/${examId}`;

  const formatDate = (d: Date | null | undefined) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <header className="space-y-6">
        <Link href="/exams" className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to My Exams
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
                {org}
              </span>
              {stages && stages.length > 0 && (
                <span className="text-sm font-medium text-foreground-muted">
                  {stages[0]} Stage
                </span>
              )}
            </div>
            
            <h1 className="text-3xl font-semibold -tracking-[0.02em] text-foreground">
              {examName}
            </h1>

            {/* Exam Details Display */}
            {examDetails && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-foreground-muted">
                {examDetails.examDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>Exam: <span className="font-medium text-foreground">{formatDate(examDetails.examDate)}</span></span>
                  </div>
                )}
                
                {(examDetails.applicationStartDate || examDetails.applicationEndDate) && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>
                      Registration: <span className="font-medium text-foreground">
                        {formatDate(examDetails.applicationStartDate) || 'TBD'} - {formatDate(examDetails.applicationEndDate) || 'TBD'}
                      </span>
                    </span>
                  </div>
                )}
                
                {examDetails.totalMarks && (
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Marks: <span className="font-medium text-foreground">{examDetails.totalMarks}</span></span>
                  </div>
                )}
              </div>
            )}
            
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/study-plan">
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                Global Study Plan
              </Button>
            </Link>
            <Link href={`${basePath}/practice`}>
              <Button className="gap-2">
                <PenTool className="w-4 h-4" />
                Practice
              </Button>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border hide-scrollbar">
          {TABS.map((tab) => {
            const href = `${basePath}${tab.href}`;
            const isActive = pathname === href || (tab.href !== "" && pathname.startsWith(href));
            const Icon = tab.icon;
            
            return (
              <Link
                key={tab.name}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-foreground-muted hover:text-foreground hover:border-border"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </header>

      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
