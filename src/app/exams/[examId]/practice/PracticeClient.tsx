"use client";

import React, { useState, useTransition } from "react";
import { PenTool, Settings2, Plus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Subject, Topic, PracticeAttempt, PracticeQuestion, Document } from "@prisma/client";
import { 
  startPracticeAttemptAction, 
  getPracticeQuestionsAction
} from "@/actions/practiceActions";
import { useRouter } from "next/navigation";
import Link from 'next/link';

type PracticeClientProps = {
  examId: string;
  subjects: (Subject & { topics: Topic[] })[];
  previousAttempts: PracticeAttempt[];
  documents?: Document[];
};

export default function PracticeClient({ examId, subjects, previousAttempts, documents = [] }: PracticeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  
  const [numQuestions, setNumQuestions] = useState<number>(20);
  const [timeLimit, setTimeLimit] = useState<number>(0);

  const handleStartPractice = () => {
    startTransition(async () => {
      // 1. Fetch questions first
      const qRes = await getPracticeQuestionsAction(
        examId, 
        selectedSubjectIds, 
        selectedTopicIds, 
        selectedDocumentIds, 
        numQuestions
      );
      
      if (!qRes.success || !qRes.data || qRes.data.length === 0) {
        alert("No questions found for the selected criteria. Please import some questions first.");
        return;
      }

      // 2. Start attempt
      const attemptRes = await startPracticeAttemptAction({
        examId,
        subjectIds: selectedSubjectIds,
        topicIds: selectedTopicIds,
        documentIds: selectedDocumentIds,
        questionIds: qRes.data.map((q) => q.id),
      });

      if (!attemptRes.success || !attemptRes.data) {
        alert((attemptRes as any).error || 'Failed to start practice attempt');
        return;
      }

      // 3. Navigate to active test page with timeLimit query param
      router.push(`/exams/${examId}/practice/test/${attemptRes.data.id}${timeLimit > 0 ? `?timeLimit=${timeLimit}` : ''}`);
    });
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(s => s !== id);
      }
      return [...prev, id];
    });
  };

  const toggleTopic = (id: string) => {
    setSelectedTopicIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(t => t !== id);
      }
      return [...prev, id];
    });
  };

  const toggleDocument = (id: string) => {
    setSelectedDocumentIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(d => d !== id);
      }
      return [...prev, id];
    });
  };

  const clearSubjects = () => {
    setSelectedSubjectIds([]);
    setSelectedTopicIds([]);
  };

  const clearTopics = () => setSelectedTopicIds([]);
  const clearDocuments = () => setSelectedDocumentIds([]);

  // Collect topics only from selected subjects, or from all subjects if none selected
  const availableTopics = selectedSubjectIds.length > 0 
    ? subjects.filter(s => selectedSubjectIds.includes(s.id)).flatMap(s => s.topics)
    : subjects.flatMap(s => s.topics);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium -tracking-[0.01em] text-foreground">Practice Center</h2>
          <p className="text-sm text-foreground-muted mt-1">Configure and start mock sessions.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-6 bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Settings2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg text-foreground">Start New Session</h3>
            </div>
            
            <div className="space-y-6">
              
              {/* SUBJECTS MULTI-SELECT */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-foreground">Subjects</label>
                  {selectedSubjectIds.length > 0 && (
                    <button onClick={clearSubjects} className="text-xs text-primary hover:underline">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={clearSubjects}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors flex items-center gap-1.5 ${
                      selectedSubjectIds.length === 0 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-surface text-foreground-muted border-border hover:border-primary'
                    }`}
                  >
                    {selectedSubjectIds.length === 0 && <Check className="w-3 h-3" />}
                    All Subjects
                  </button>
                  {subjects.map(s => (
                    <button
                      key={s.id}
                      onClick={() => toggleSubject(s.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors flex items-center gap-1.5 ${
                        selectedSubjectIds.includes(s.id)
                          ? 'bg-primary/10 text-primary border-primary/30' 
                          : 'bg-surface text-foreground-muted border-border hover:border-primary/50'
                      }`}
                    >
                      {selectedSubjectIds.includes(s.id) && <Check className="w-3 h-3" />}
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* TOPICS MULTI-SELECT */}
              {availableTopics.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-foreground">Topics</label>
                    {selectedTopicIds.length > 0 && (
                      <button onClick={clearTopics} className="text-xs text-primary hover:underline">Clear</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={clearTopics}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors flex items-center gap-1.5 ${
                        selectedTopicIds.length === 0 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-surface text-foreground-muted border-border hover:border-primary'
                      }`}
                    >
                      {selectedTopicIds.length === 0 && <Check className="w-3 h-3" />}
                      All Topics
                    </button>
                    {availableTopics.map(t => (
                      <button
                        key={t.id}
                        onClick={() => toggleTopic(t.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors flex items-center gap-1.5 ${
                          selectedTopicIds.includes(t.id)
                            ? 'bg-primary/10 text-primary border-primary/30' 
                            : 'bg-surface text-foreground-muted border-border hover:border-primary/50'
                        }`}
                      >
                        {selectedTopicIds.includes(t.id) && <Check className="w-3 h-3" />}
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* DOCUMENTS MULTI-SELECT */}
              {documents.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-foreground">Source Material</label>
                    {selectedDocumentIds.length > 0 && (
                      <button onClick={clearDocuments} className="text-xs text-primary hover:underline">Clear</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={clearDocuments}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors flex items-center gap-1.5 ${
                        selectedDocumentIds.length === 0 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-surface text-foreground-muted border-border hover:border-primary'
                      }`}
                    >
                      {selectedDocumentIds.length === 0 && <Check className="w-3 h-3" />}
                      All Material
                    </button>
                    {documents.map(d => (
                      <button
                        key={d.id}
                        onClick={() => toggleDocument(d.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors flex items-center gap-1.5 max-w-[200px] truncate ${
                          selectedDocumentIds.includes(d.id)
                            ? 'bg-primary/10 text-primary border-primary/30' 
                            : 'bg-surface text-foreground-muted border-border hover:border-primary/50'
                        }`}
                        title={d.name}
                      >
                        {selectedDocumentIds.includes(d.id) && <Check className="w-3 h-3 shrink-0" />}
                        <span className="truncate">{d.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Questions</label>
                  <select 
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={80}>80</option>
                    <option value={100}>100</option>
                    <option value={150}>150</option>
                    <option value={200}>200</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Time (min)</label>
                  <select 
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                  >
                    <option value={0}>No Limit</option>
                    <option value={5}>5 mins</option>
                    <option value={10}>10 mins</option>
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex gap-2">
                <Button className="flex-1 gap-2 bg-[#4A78E0] hover:bg-blue-700 text-white" size="lg" onClick={handleStartPractice} disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />} Start Practice
                </Button>
                <Link href={`/exams/${examId}/practice/import`}>
                  <Button variant="outline" size="lg" title="Import Questions">
                    <Plus className="w-4 h-4" /> Import
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-semibold text-lg text-foreground">Recent Performance</h3>
            <div className="space-y-3">
              {previousAttempts.length === 0 ? (
                <div className="text-sm text-foreground-muted p-4 border border-border rounded-lg bg-surface text-center">
                  No practice attempts yet. Start a session to see your performance!
                </div>
              ) : (
                previousAttempts.map((attempt) => (
                  <Link key={attempt.id} href={`/exams/${examId}/practice/result/${attempt.id}`}>
                    <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between hover:border-primary transition-colors cursor-pointer">
                      <div>
                        <h4 className="font-medium text-sm text-foreground mb-1">
                          Attempt {attempt.totalQuestions} Qs
                        </h4>
                        <p className="text-xs text-foreground-muted">
                          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(attempt.startedAt))} • {formatTime(attempt.durationSeconds)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold tabular-nums ${attempt.accuracy >= 70 ? 'text-success' : attempt.accuracy >= 40 ? 'text-warning' : 'text-destructive'}`}>
                          {attempt.score.toFixed(2)} / {attempt.totalQuestions}
                        </div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-foreground-muted mt-0.5">{attempt.accuracy.toFixed(1)}% Accuracy</div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
