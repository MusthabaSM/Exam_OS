"use client";
import React from 'react';
import { SortableList } from '@/components/study-plan/SortableList';
import { DataTable } from '@/components/progress/DataTable';
import { StudyEditor } from '@/components/notes/StudyEditor';
import { ExamCarousel } from '@/components/exams/ExamCarousel';
import { KnowledgeGraph } from '@/components/exams/KnowledgeGraph';
import { ChatMessage } from '@/components/ai/ChatMessage';
import { DocumentCard } from '@/components/documents/DocumentCard';

import { BackgroundBeams } from '@/components/ui/background-beams';
import { Skiper40 } from '@/components/ui/skiper-ui/skiper40';

export default function DesignLabPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground p-8 overflow-hidden">
      <BackgroundBeams className="opacity-40" />
      
      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        <header className="border-b border-border pb-6">
          <h1 className="text-4xl font-semibold -tracking-[0.02em] text-primary">Design Lab</h1>
          <p className="text-foreground-muted mt-2 text-lg">Verifying the UI/UX ecosystem integration.</p>
        </header>

        {/* Design Intelligence */}
        <section className="space-y-6">
          <h2 className="text-2xl font-medium -tracking-[0.01em]">Design Intelligence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Colors */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wider">Semantic Colors</h3>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center shadow-sm" title="Primary" />
                <div className="w-10 h-10 rounded-md bg-success flex items-center justify-center shadow-sm" title="Success" />
                <div className="w-10 h-10 rounded-md bg-warning flex items-center justify-center shadow-sm" title="Warning" />
                <div className="w-10 h-10 rounded-md bg-destructive flex items-center justify-center shadow-sm" title="Destructive" />
                <div className="w-10 h-10 rounded-md bg-info flex items-center justify-center shadow-sm" title="Info" />
              </div>
            </div>
            
            {/* Typography */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wider">Typography Hierarchy</h3>
              <div className="space-y-1">
                <div className="text-2xl font-medium -tracking-[0.01em]">Heading 2</div>
                <div className="text-lg font-medium">Subheading</div>
                <div className="text-base text-foreground-muted">Standard body text reading format.</div>
                <div className="text-xs text-foreground-muted">Caption text</div>
              </div>
            </div>

            {/* States & Inputs */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wider">Interactive States</h3>
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Premium Input..." 
                  className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm shadow-sm placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-150 ease-out" 
                />
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md shadow-sm hover:scale-[1.02] transition-transform duration-150 ease-out">
                    Primary
                  </button>
                  <button className="px-4 py-2 bg-surface-elevated text-foreground border border-border text-sm font-medium rounded-md shadow-sm hover:bg-surface-hover transition-colors duration-150 ease-out">
                    Secondary
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Skiper UI */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium -tracking-[0.01em]">Animated Links (Skiper UI)</h2>
          <div className="bg-surface-elevated border border-border rounded-lg p-6 h-[300px] shadow-sm relative overflow-hidden">
            <Skiper40 />
          </div>
        </section>

        {/* Core Interactions */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-medium -tracking-[0.01em]">Study Planner (dnd-kit)</h2>
            <SortableList />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-medium -tracking-[0.01em]">Notes Editor (Tiptap)</h2>
            <StudyEditor />
          </div>
        </section>

        {/* Data & Layouts */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium -tracking-[0.01em]">Progress Tracking (TanStack Table)</h2>
          <DataTable />
        </section>

        {/* Visuals & Nodes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-medium -tracking-[0.01em]">Knowledge Graph (React Flow)</h2>
            <KnowledgeGraph />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-medium -tracking-[0.01em]">Document Library</h2>
            <div className="grid grid-cols-2 gap-4">
              <DocumentCard title="Chapter 4 Notes" type="PDF" />
              <DocumentCard title="Midterm Study Guide" type="DOCX" />
            </div>
          </div>
        </section>

        {/* Motion & Carousel */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium -tracking-[0.01em]">Exam Browser (Embla Carousel)</h2>
          <ExamCarousel />
        </section>

        {/* AI Interface */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium -tracking-[0.01em]">AI Assistant (Motion)</h2>
          <div className="bg-surface-elevated border border-border rounded-lg p-6 min-h-[200px] flex flex-col justify-end shadow-sm">
            <ChatMessage message="I can help you review Calculus II. Where would you like to start?" isAi={true} />
            <ChatMessage message="Let's go over integration by parts." isAi={false} />
            <ChatMessage message="Great! The formula is ∫u dv = uv - ∫v du. Here's a practice problem..." isAi={true} />
          </div>
        </section>

      </div>
    </div>
  );
}
