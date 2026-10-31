'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp, ChevronDown, ChevronRight, AlertCircle, TrendingUp, CheckCircle, Target, Award } from 'lucide-react';
import ImportWeightageDialog from '@/components/weightage/ImportWeightageDialog';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface TopicWeightageItem {
  topicId: string;
  topicName: string;
  weightage: number | null;
  questionCount: number | null;
  marksCount: number | null;
  estimatedDifficulty: string;
  sourcePriority: number | null;
  progress: number | null;
  priorityScore: number;
}

export interface SubjectWeightageItem {
  subjectId: string;
  subjectName: string;
  weightage: number | null;
  questionCount: number | null;
  marksCount: number | null;
  estimatedDifficulty: string;
  studyRecommendation: string | null;
  sourcePriority: number | null;
  progress: number | null;
  priorityScore: number;
  topics: TopicWeightageItem[];
}

export interface PhaseWeightageData {
  phaseName: string;
  subjects: SubjectWeightageItem[];
}

interface TopicWeightageData {
  examName: string;
  examPatternData: Record<string, any> | null;
  phases: PhaseWeightageData[];
  subjects: SubjectWeightageItem[]; // Fallback for exams without distinct phases
}

export default function TopicWeightageClient({ examId, data }: { examId: string; data: TopicWeightageData }) {
  const router = useRouter();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  
  // Phase state
  const hasDistinctPhases = data.phases && data.phases.length > 1;
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  
  const currentSubjects = hasDistinctPhases ? data.phases[activePhaseIndex].subjects : data.subjects;

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'High': return 'text-destructive bg-destructive/10';
      case 'Medium': return 'text-warning bg-warning/10';
      case 'Low': return 'text-success bg-success/10';
      default: return 'text-foreground-muted bg-surface border border-border';
    }
  };

  const hasAnyWeightage = currentSubjects.some(s => 
    s.weightage !== null || 
    s.questionCount !== null || 
    s.marksCount !== null || 
    s.sourcePriority !== null || 
    s.studyRecommendation !== null ||
    s.topics.some(t => t.sourcePriority !== null || t.weightage !== null || t.questionCount !== null || t.marksCount !== null)
  );

  const recommendedFocus = useMemo(() => {
    // Top 3 subjects by explicit priority, then weightage, then progress
    return [...currentSubjects]
      .filter(s => 
        s.priorityScore > 0 || 
        s.sourcePriority !== null || 
        s.weightage !== null || 
        s.marksCount !== null || 
        s.questionCount !== null ||
        s.studyRecommendation !== null ||
        s.topics.some(t => t.sourcePriority !== null || t.priorityScore > 0)
      )
      .sort((a, b) => {
        // 1. Explicit PDF priority (lower is better, e.g., Priority 1 > Priority 2)
        if (a.sourcePriority !== null && b.sourcePriority !== null) {
          if (a.sourcePriority !== b.sourcePriority) {
            return a.sourcePriority - b.sourcePriority;
          }
        } else if (a.sourcePriority !== null) {
          return -1;
        } else if (b.sourcePriority !== null) {
          return 1;
        }

        // 2. Higher marks/weightage
        const weightA = a.marksCount ?? a.questionCount ?? a.weightage ?? 0;
        const weightB = b.marksCount ?? b.questionCount ?? b.weightage ?? 0;
        if (weightA !== weightB) {
          return weightB - weightA;
        }

        // 3. Lower progress (we want to study things we haven't done yet)
        const progA = a.progress ?? 0;
        const progB = b.progress ?? 0;
        return progA - progB;
      })
      .slice(0, 3);
  }, [currentSubjects]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">Topic Weightage</h1>
          <p className="text-foreground-muted text-base">{data.examName}</p>
        </div>
        <Button 
          onClick={() => setIsImportOpen(true)}
          className="shrink-0 font-medium"
        >
          <FileUp className="w-4 h-4 mr-2" />
          Import Weightage PDF
        </Button>
      </div>

      {hasDistinctPhases && (
        <div className="flex flex-wrap gap-2 mb-6">
          {data.phases.map((phase, idx) => (
            <Button
              key={phase.phaseName}
              variant={activePhaseIndex === idx ? "default" : "outline"}
              onClick={() => setActivePhaseIndex(idx)}
              className="rounded-full"
            >
              {phase.phaseName}
            </Button>
          ))}
        </div>
      )}

      {!hasAnyWeightage && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center">
          <Target className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No Study Strategy Found</h2>
          <p className="text-foreground-muted max-w-md mx-auto mb-6">
            Import a syllabus study guide or weightage PDF to automatically generate a recommended study focus based on exam pattern and your progress.
          </p>
          <Button onClick={() => setIsImportOpen(true)} variant="default">
            Import PDF Now
          </Button>
        </div>
      )}

      {hasAnyWeightage && (
        <>
          {/* EXAM PATTERN SECTION */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">Exam Pattern</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <PatternCard label="Questions" value={data.examPatternData?.totalQuestions ?? "Not verified"} />
              <PatternCard label="Marks" value={data.examPatternData?.totalMarks ?? "Not verified"} />
              <PatternCard label="Duration" value={data.examPatternData?.duration ?? "Not verified"} />
              <PatternCard label="Negative Marking" value={data.examPatternData?.negativeMarking ?? "Not verified"} />
              <PatternCard label="Selection Stages" value={data.examPatternData?.selectionStages ?? "Not verified"} className="col-span-2 md:col-span-1 lg:col-span-1" />
            </div>
            <p className="text-xs text-foreground-muted mt-2 italic flex items-center">
              <AlertCircle className="w-3 h-3 mr-1 inline" />
              Official verified information
            </p>
          </section>

          {/* RECOMMENDED FOCUS SECTION */}
          {recommendedFocus.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground border-b border-border pb-2 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                Recommended Focus
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {recommendedFocus.map((subject, idx) => (
                  <div key={subject.subjectId} className="bg-surface border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                      #{idx + 1}
                    </div>
                    <h3 className="font-semibold text-lg text-foreground pr-8 mb-3 leading-tight">{subject.subjectName}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center text-foreground-muted">
                        <span>Weightage:</span>
                        <span className="font-medium text-foreground">
                           {subject.marksCount ? `${subject.marksCount} Marks` : subject.questionCount ? `${subject.questionCount} Qs` : subject.weightage ? `${subject.weightage}%` : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-foreground-muted">
                        <span>Priority:</span>
                        <span className="font-medium text-foreground">
                          {subject.sourcePriority !== null ? `Priority ${subject.sourcePriority}` : 'Not Specified'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-foreground-muted">
                        <span>Study Effort:</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getDifficultyColor(subject.estimatedDifficulty))}>
                          {subject.estimatedDifficulty}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-foreground-muted">
                        <span>Your Progress:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-background rounded-full overflow-hidden border border-border">
                            <div className="h-full bg-primary" style={{ width: `${subject.progress || 0}%` }} />
                          </div>
                          <span className="font-medium text-foreground text-xs w-8 text-right">{subject.progress || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SUBJECT WEIGHTAGE & TOPICS SECTION */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground border-b border-border pb-2">Subject & Topic Weightage</h2>
            
            <div className="space-y-4">
              {currentSubjects.map((subject) => {
                const isExpanded = expandedSubjects[subject.subjectId];
                return (
                  <div key={subject.subjectId} className="border border-border rounded-xl overflow-hidden bg-surface shadow-sm transition-all">
                    
                    {/* Subject Header */}
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-background/50 transition-colors group"
                      onClick={() => toggleSubject(subject.subjectId)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-foreground-muted group-hover:text-foreground transition-colors">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </div>
                        <h3 className="font-semibold text-foreground">{subject.subjectName}</h3>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        {/* Desktop Stats */}
                        <div className="hidden md:flex items-center gap-6">
                           <div className="flex flex-col items-end">
                             <span className="text-foreground-muted text-xs">Weightage</span>
                             <span className="font-medium">
                                {subject.weightage ? `${subject.weightage}%` : subject.marksCount ? `${subject.marksCount} M` : subject.questionCount ? `${subject.questionCount} Qs` : '-'}
                             </span>
                           </div>
                           <div className="flex flex-col items-end">
                             <span className="text-foreground-muted text-xs">Effort</span>
                             <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium mt-0.5", getDifficultyColor(subject.estimatedDifficulty))}>
                               {subject.estimatedDifficulty}
                             </span>
                           </div>
                           <div className="flex flex-col items-end w-24">
                             <span className="text-foreground-muted text-xs">Progress</span>
                             <div className="flex items-center gap-2 mt-1">
                                <div className="w-12 h-1.5 bg-background rounded-full overflow-hidden border border-border">
                                  <div className="h-full bg-primary" style={{ width: `${subject.progress || 0}%` }} />
                                </div>
                                <span className="font-medium text-xs">{subject.progress || 0}%</span>
                             </div>
                           </div>
                        </div>
                        {subject.sourcePriority && (
                           <div className="bg-primary text-primary-foreground font-bold px-2.5 py-1 rounded-md text-xs whitespace-nowrap">
                             Priority {subject.sourcePriority}
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Topics List */}
                    {isExpanded && (
                      <div className="bg-background border-t border-border p-0">
                        {subject.topics.length === 0 ? (
                          <div className="p-6 text-center text-foreground-muted text-sm">
                            No specific topics extracted for this subject.
                          </div>
                        ) : (
                          <div className="p-4 space-y-3">
                            <h4 className="text-sm font-semibold text-foreground-muted mb-2 px-2">Core / Recommended Topics</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2">
                              {subject.topics.map(topic => (
                                <div key={topic.topicId} className="flex items-center justify-between bg-surface border border-border rounded-lg p-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span className="font-medium text-foreground text-sm">{topic.topicName}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-xs">
                                    {(topic.questionCount || topic.marksCount || topic.weightage || topic.sourcePriority) ? (
                                      <span className="text-foreground-muted">
                                        {topic.questionCount ? `${topic.questionCount} Qs ` : ''}
                                        {topic.marksCount ? `${topic.marksCount} M ` : ''}
                                        {topic.weightage ? `${topic.weightage}% ` : ''}
                                        {topic.sourcePriority ? `Priority ${topic.sourcePriority}` : ''}
                                      </span>
                                    ) : (
                                      <span className="text-foreground-muted italic">Core Topic</span>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <div className="w-12 h-1.5 bg-background rounded-full overflow-hidden border border-border">
                                        <div className="h-full bg-primary" style={{ width: `${topic.progress || 0}%` }} />
                                      </div>
                                      <span className="font-medium">{topic.progress || 0}%</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Import Dialog */}
      <ImportWeightageDialog 
        examId={examId}
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={() => {
          setIsImportOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function PatternCard({ label, value, className }: { label: string, value: string | number, className?: string }) {
  return (
    <div className={cn("bg-surface border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm", className)}>
      <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-1">{label}</span>
      <span className="text-lg font-bold text-foreground">{value}</span>
    </div>
  );
}
