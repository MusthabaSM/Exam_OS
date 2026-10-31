"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Clock, PlayCircle, PauseCircle, CheckCircle2, Plus, Loader2, BookOpen, Upload, FileText, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  createStudyTaskAction,
  deleteStudyTaskAction,
  updateStudyTaskAction,
  previewStudyTasksPdfAction,
  importStudyTasksAction,
  startStudySessionAction,
  pauseStudySessionAction,
  resumeStudySessionAction,
  completeStudySessionAction,
} from "@/actions/studyActions";
import { SmoothInput } from "@/components/ui/SmoothInput";
import type { GlobalStudyTask } from "./page";
import type { StudySession } from "@prisma/client";

export default function GlobalStudyPlanClient({ 
  initialTasks, 
  initialActiveSession,
  selectedDateStr
}: { 
  initialTasks: GlobalStudyTask[];
  initialActiveSession: StudySession | null;
  selectedDateStr?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [activeSession, setActiveSession] = useState<StudySession | null>(initialActiveSession);
  
  // Date State
  // Default to local today if not specified
  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const currentDateStr = selectedDateStr || todayStr;
  const displayDate = new Date(currentDateStr + "T12:00:00").toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const isToday = currentDateStr === todayStr;

  const navigateDate = (days: number) => {
    const d = new Date(currentDateStr + "T12:00:00");
    d.setDate(d.getDate() + days);
    const newDate = d.toISOString().split('T')[0];
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', newDate);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (!newDate) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', newDate);
    router.push(`${pathname}?${params.toString()}`);
  };
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Add Task State
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskTime, setNewTaskTime] = useState("60");

  // Timer State
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeSession) return;
    
    // Calculate initial elapsed time
    const calcElapsed = () => {
      let total = activeSession.durationSeconds;
      if (activeSession.status === 'ACTIVE' && activeSession.startedAt) {
        const start = new Date(activeSession.startedAt).getTime();
        const now = Date.now();
        total += Math.floor((now - start) / 1000);
      }
      return total;
    };

    setElapsed(calcElapsed());

    let interval: NodeJS.Timeout;
    if (activeSession.status === 'ACTIVE') {
      interval = setInterval(() => {
        setElapsed(calcElapsed());
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const submitNewTask = () => {
    if (!newTaskTitle) return;
    startTransition(async () => {
      const res = await createStudyTaskAction({
        examId: null, // Global task
        title: newTaskTitle,
        description: newTaskDesc || undefined,
        estimatedMinutes: parseInt(newTaskTime) || 60,
      });
      if (!res.success) {
        alert(res.error);
      } else {
        setShowAddModal(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskTime("60");
      }
    });
  };

  const startSession = (task: GlobalStudyTask) => {
    startTransition(async () => {
      // For a global task, examId might be null. 
      // startStudySessionAction takes an object. We'll pass the task's examId (or null)
      const res = await startStudySessionAction({ examId: task.examId, studyTaskId: task.id });
      if (!res.success) {
        alert(res.error || "Failed to start session");
      } else if (res.data) {
        setActiveSession(res.data);
      }
    });
  };

  const pauseSession = () => {
    if (!activeSession) return;
    startTransition(async () => {
      // pass empty string if no examId (the action doesn't require examId for pause anyway, it just takes sessionId, but action signature might require it for revalidation. We updated the signature to just revalidate `/study-plan` anyway)
      const res = await pauseStudySessionAction({ id: activeSession.id });
      if (res.success && res.data) {
        setActiveSession(res.data);
      }
    });
  };

  const resumeSession = () => {
    if (!activeSession) return;
    startTransition(async () => {
      const res = await resumeStudySessionAction({ id: activeSession.id });
      if (res.success && res.data) {
        setActiveSession(res.data);
      }
    });
  };

  const completeSession = () => {
    if (!activeSession) return;
    startTransition(async () => {
      const res = await completeStudySessionAction({ id: activeSession.id });
      if (res.success && res.data) {
        setActiveSession(null);
        setElapsed(0);
      }
    });
  };

  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewSummary, setPreviewSummary] = useState<string | null>(null);
  const [tasksToCreate, setTasksToCreate] = useState<any[] | null>(null);
  
  const handlePreview = () => {
    if (!importFile) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const res = await previewStudyTasksPdfAction(formData);
      if (res.success) {
        if (res.data) {
          setPreviewSummary(res.data.summary);
          setTasksToCreate(res.data.tasksToCreate);
        }
      } else {
        alert(res.error || "Failed to preview PDF");
      }
    });
  };

  const handleConfirmImport = () => {
    if (!tasksToCreate) return;
    startTransition(async () => {
      const res = await importStudyTasksAction(tasksToCreate);
      if (res.success) {
        alert(`Imported ${res.data?.importedCount} tasks successfully.`);
        setShowImportModal(false);
        setImportFile(null);
        setPreviewSummary(null);
        setTasksToCreate(null);
      } else {
        alert(res.error || "Failed to import tasks");
      }
    });
  };

  const activeTask = activeSession?.studyTaskId 
    ? initialTasks.find(t => t.id === activeSession.studyTaskId) 
    : null;

  return (
    <div className="space-y-6">
      
      {activeSession && activeTask && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/30 flex items-center justify-center bg-background">
                <div className={`w-14 h-14 rounded-full border-4 border-primary flex items-center justify-center ${activeSession.status === 'ACTIVE' ? 'animate-pulse' : ''}`}>
                  <Clock className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-primary mb-1 uppercase tracking-wider">Active Session</p>
              <h3 className="text-xl font-semibold text-foreground">{activeTask.title}</h3>
              <p className="text-foreground-muted text-sm flex items-center gap-2 mt-1">
                {activeTask.exam?.name && (
                  <span className="inline-flex items-center gap-1"><BookOpen className="w-3 h-3"/> {activeTask.exam.name}</span>
                )}
                {activeTask.subject?.name && <span>• {activeTask.subject.name}</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-3xl font-bold tabular-nums text-foreground">{formatTime(elapsed)}</div>
              <div className="text-sm text-foreground-muted">Target: {activeTask.estimatedMinutes}m</div>
            </div>
            
            <div className="flex items-center gap-2">
              {activeSession.status === 'ACTIVE' ? (
                <Button onClick={pauseSession} variant="outline" size="icon" className="h-12 w-12 rounded-full" disabled={isPending}>
                  <PauseCircle className="w-6 h-6" />
                </Button>
              ) : (
                <Button onClick={resumeSession} variant="outline" size="icon" className="h-12 w-12 rounded-full border-primary text-primary hover:bg-primary/10" disabled={isPending}>
                  <PlayCircle className="w-6 h-6" />
                </Button>
              )}
              <Button onClick={completeSession} size="lg" className="rounded-full gap-2 px-6 h-12 bg-success hover:bg-success/90 text-success-foreground" disabled={isPending}>
                <CheckCircle2 className="w-5 h-5" />
                Finish
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-medium -tracking-[0.01em] text-foreground">
            {isToday ? "Today's Tasks" : displayDate}
          </h2>
          <div className="flex items-center bg-surface border border-border rounded-lg p-0.5 shadow-sm">
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md" onClick={() => navigateDate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="relative">
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md hover:bg-transparent">
                <CalendarIcon className="w-4 h-4 text-foreground-muted" />
              </Button>
              <input
                type="date"
                value={currentDateStr}
                onChange={handleDateChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-md" onClick={() => navigateDate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          {!isToday && (
            <Button variant="link" className="text-xs px-2 text-primary" onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete('date');
              router.push(`${pathname}?${params.toString()}`);
            }}>
              Go to Today
            </Button>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={() => setShowImportModal(true)} disabled={isPending || activeSession !== null}>
            <Upload className="w-4 h-4" /> Import Schedule PDF
          </Button>
          <Button className="gap-2 flex-1 sm:flex-none" onClick={() => setShowAddModal(true)} disabled={isPending || activeSession !== null}>
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {initialTasks.map((task) => (
          <div 
            key={task.id} 
            className={`flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 bg-surface border rounded-xl shadow-sm transition-all duration-200 group ${task.status === 'TODO' ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}
          >
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-20 shrink-0 flex flex-col items-center justify-center text-center">
                {task.scheduledDate && (
                  <div className="text-sm font-bold text-foreground mb-1">
                    {new Date(task.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                <div className="text-xs font-medium text-foreground-muted tabular-nums">
                  {task.estimatedMinutes ? `${task.estimatedMinutes}m` : '--'}
                </div>
              </div>
              <div className="w-px h-12 bg-border hidden sm:block" />
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-medium text-foreground text-base">
                    {task.title}
                  </p>
                  {task.status === "TODO" && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                      Todo
                    </span>
                  )}
                  {task.exam?.name && (
                    <span className="text-[10px] font-semibold text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {task.exam.name}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="text-sm text-foreground-muted mb-1">
                    {task.description}
                  </p>
                )}
                
                {(task.subject?.name || task.topic?.name) && (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-foreground-muted">
                    {task.subject?.name && <span>{task.subject.name}</span>}
                    {task.subject?.name && task.topic?.name && <span>•</span>}
                    {task.topic?.name && <span className="font-medium text-foreground/80">{task.topic.name}</span>}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
              {task.status === "COMPLETED" ? (
                <div className="flex items-center gap-1.5 text-success text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Done ({task.actualMinutes || 0}m)
                </div>
              ) : (
                <Button 
                  onClick={() => startSession(task)}
                  variant="default"
                  size="sm"
                  className="gap-2"
                  disabled={isPending || activeSession !== null}
                >
                  <PlayCircle className="w-4 h-4" />
                  Start
                </Button>
              )}
            </div>
          </div>
        ))}
        {initialTasks.length === 0 && (
          <div className="text-center py-12 text-foreground-muted border rounded-xl border-dashed">
            <p className="mb-4">No tasks found in your global study plan for {isToday ? "today" : displayDate}.</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => setShowImportModal(true)} variant="outline" disabled={isPending}>
                <Upload className="w-4 h-4 mr-2" /> Import PDF
              </Button>
              <Button onClick={() => setShowAddModal(true)} disabled={isPending}>
                <Plus className="w-4 h-4 mr-2" /> Add Global Task
              </Button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-border font-medium">Add Global Task</div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <SmoothInput type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="e.g. Read Newspaper" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} className="w-full border border-border rounded-md px-3 py-2 bg-background resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Task details..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estimated Minutes</label>
                <SmoothInput type="number" value={newTaskTime} onChange={e => setNewTaskTime(e.target.value)} min="5" step="5" />
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2 bg-surface-hover">
              <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={isPending}>Cancel</Button>
              <Button onClick={submitNewTask} disabled={isPending || !newTaskTitle}>
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Add Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Import Global Schedule
              </h3>
              <p className="text-sm text-foreground-muted mt-1">
                Upload a PDF schedule. We will automatically extract dates and topics, matching them against all your exams.
              </p>
            </div>
            <div className="p-5 space-y-4">
              {previewSummary ? (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-primary whitespace-pre-line text-sm">
                  {previewSummary}
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center flex flex-col items-center justify-center bg-surface-hover transition-colors hover:border-primary/50 relative">
                  <Upload className="w-8 h-8 text-foreground-muted mb-3" />
                  <p className="text-sm font-medium mb-1">
                    {importFile ? importFile.name : "Click to browse or drag PDF here"}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    Supports standard schedule formats
                  </p>
                  <input 
                    type="file" 
                    accept="application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setImportFile(e.target.files[0]);
                    }}
                    disabled={isPending}
                  />
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2 bg-surface-hover">
              <Button variant="outline" onClick={() => { setShowImportModal(false); setImportFile(null); setPreviewSummary(null); setTasksToCreate(null); }} disabled={isPending}>Cancel</Button>
              {previewSummary ? (
                <Button onClick={handleConfirmImport} disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} 
                  {isPending ? "Importing..." : "Confirm Import"}
                </Button>
              ) : (
                <Button onClick={handlePreview} disabled={!importFile || isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} 
                  {isPending ? "Extracting..." : "Extract Schedule"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
