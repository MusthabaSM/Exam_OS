'use client';

import React, { useState, useRef } from 'react';
import { Plus, MoreVertical, ChevronDown, ChevronRight, GripVertical, CheckCircle2, Circle, Pencil, Trash2, Loader2, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubjectWithTopics, createSubjectAction, updateSubjectAction, deleteSubjectAction, createTopicAction, updateTopicAction, deleteTopicAction, reorderTopicsAction, bulkCreateSyllabusAction, deleteAllSubjectsAction } from '@/actions/syllabusActions';
import { GlobalLoader } from '@/components/loading/GlobalLoader';
import { Topic, TopicStatus, Difficulty } from '@prisma/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SyllabusClientProps {
  examId: string;
  initialSubjects: SubjectWithTopics[];
}

function SortableTopicItem({ 
  topic, 
  onEdit, 
  onDelete, 
  onUpdateStatus,
  examId 
}: { 
  topic: Topic, 
  onEdit: (t: Topic) => void, 
  onDelete: (id: string) => void, 
  onUpdateStatus: (id: string, status: TopicStatus) => void,
  examId: string 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: topic.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const getStatusIcon = (status: TopicStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'IN_PROGRESS':
        return <Circle className="w-4 h-4 text-primary" />;
      case 'REVISE':
        return <Circle className="w-4 h-4 text-warning" />;
      default:
        return <Circle className="w-4 h-4 text-foreground-muted" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 pl-12 border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors group bg-surface gap-3 sm:gap-0 ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab hover:bg-surface-elevated p-1 rounded">
          <GripVertical className="w-4 h-4 text-border group-hover:text-foreground-muted" />
        </div>
        {getStatusIcon(topic.status)}
        <span className={`text-sm font-medium ${topic.status === 'COMPLETED' ? 'text-foreground-muted line-through' : 'text-foreground'}`}>
          {topic.name}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-xs font-medium text-foreground-muted tabular-nums">
        <select 
          className="bg-transparent border border-border/50 hover:border-border rounded px-2 py-1 cursor-pointer focus:outline-none focus:border-primary text-xs w-32"
          value={topic.status}
          onChange={(e) => onUpdateStatus(topic.id, e.target.value as TopicStatus)}
        >
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">Learning</option>
          <option value="COMPLETED">Completed</option>
          <option value="REVISE">Needs Revision</option>
        </select>
        <button onClick={() => onEdit(topic)} className="text-foreground-muted hover:text-primary sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(topic.id)} className="text-foreground-muted hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function SyllabusClient({ examId, initialSubjects }: SyllabusClientProps) {
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>(initialSubjects);
  
  // Start with all subjects collapsed by default
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<{ name: string; topics: string[] }[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggle = (subjectId: string) => {
    setExpanded(prev => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/exams/parse-syllabus", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data) {
        setParsedPreview(data.data);
      } else {
        alert(data.error || "Failed to parse syllabus");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while parsing the file.");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!parsedPreview) return;
    setIsImporting(true);
    try {
      const res = await bulkCreateSyllabusAction({ examId, parsedData: parsedPreview });
      if (res.success) {
        // Will refresh via revalidatePath, but we should clear preview
        setParsedPreview(null);
        window.location.reload(); // Simple brute force to ensure we see the updated subjects immediately in Client component if revalidatePath isn't fast enough
      } else {
        alert(res.error || "Failed to import syllabus");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearSyllabus = async () => {
    if (!window.confirm("Are you SURE you want to delete the ENTIRE syllabus? This action cannot be undone.")) return;
    
    setIsClearing(true);
    const res = await deleteAllSubjectsAction(examId);
    if (res.success) {
      setSubjects([]);
      setExpanded({});
    } else {
      alert(res.error || "Failed to clear syllabus");
    }
    setIsClearing(false);
  };

  const handleAddSubject = async () => {
    const name = window.prompt("Enter new subject name:");
    if (!name || name.trim() === "") return;

    setLoading(true);
    const res = await createSubjectAction({ examId, name: name.trim() });
    if (res.success) {
      setSubjects(prev => [...prev, { ...res.data, topics: [] }]);
      setExpanded(prev => ({ ...prev, [res.data.id]: true }));
    } else {
      alert(res.error || "Failed to create subject");
    }
    setLoading(false);
  };

  const handleEditSubject = async (subject: SubjectWithTopics) => {
    const name = window.prompt("Enter subject name:", subject.name);
    if (!name || name.trim() === "" || name === subject.name) return;

    setLoading(true);
    const res = await updateSubjectAction({ id: subject.id, examId, name: name.trim() }, examId);
    if (res.success) {
      setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, name: res.data.name } : s));
    } else {
      alert(res.error || "Failed to edit subject");
    }
    setLoading(false);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this subject? All topics inside will be deleted.")) return;

    setLoading(true);
    const res = await deleteSubjectAction(id, examId);
    if (res.success) {
      setSubjects(prev => prev.filter(s => s.id !== id));
    } else {
      alert(res.error || "Failed to delete subject");
    }
    setLoading(false);
  };

  const handleAddTopic = async (subjectId: string) => {
    const name = window.prompt("Enter new topic name:");
    if (!name || name.trim() === "") return;

    setLoading(true);
    const res = await createTopicAction({ subjectId, name: name.trim() }, examId);
    if (res.success) {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          return { ...s, topics: [...s.topics, res.data] };
        }
        return s;
      }));
    } else {
      alert(res.error || "Failed to create topic");
    }
    setLoading(false);
  };

  const handleEditTopic = async (topic: Topic) => {
    const name = window.prompt("Enter topic name:", topic.name);
    if (!name || name.trim() === "" || name === topic.name) return;

    setLoading(true);
    const res = await updateTopicAction({ id: topic.id, name: name.trim() }, examId);
    if (res.success) {
      setSubjects(prev => prev.map(s => {
        if (s.id === topic.subjectId) {
          return { ...s, topics: s.topics.map(t => t.id === topic.id ? res.data : t) };
        }
        return s;
      }));
    } else {
      alert(res.error || "Failed to edit topic");
    }
    setLoading(false);
  };

  const handleUpdateTopicStatus = async (topicId: string, status: TopicStatus) => {
    setLoading(true);
    const res = await updateTopicAction({ id: topicId, status }, examId);
    if (res.success) {
      setSubjects(prev => prev.map(s => {
        return {
          ...s,
          topics: s.topics.map(t => t.id === topicId ? { ...t, status: res.data.status } : t)
        };
      }));
    } else {
      alert(res.error || "Failed to update topic status");
    }
    setLoading(false);
  };

  const handleDeleteTopic = async (topicId: string, subjectId: string) => {
    if (!window.confirm("Are you sure you want to delete this topic?")) return;

    setLoading(true);
    const res = await deleteTopicAction(topicId, examId);
    if (res.success) {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) {
          return { ...s, topics: s.topics.filter(t => t.id !== topicId) };
        }
        return s;
      }));
    } else {
      alert(res.error || "Failed to delete topic");
    }
    setLoading(false);
  };

  const handleDragEnd = async (event: DragEndEvent, subjectId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const oldIndex = subject.topics.findIndex(t => t.id === active.id);
    const newIndex = subject.topics.findIndex(t => t.id === over.id);

    const newTopics = arrayMove(subject.topics, oldIndex, newIndex);
    
    // Optimistic UI update
    setSubjects(prev => prev.map(s => {
      if (s.id === subjectId) return { ...s, topics: newTopics };
      return s;
    }));

    // Update order values
    const updates = newTopics.map((t, index) => ({ id: t.id, newOrder: index }));

    const res = await reorderTopicsAction(subjectId, updates, examId);
    if (!res.success) {
      // Revert if failed
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) return { ...s, topics: subject.topics };
        return s;
      }));
      alert(res.error || "Failed to reorder topics");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium -tracking-[0.01em] text-foreground">Syllabus Management</h2>
          <p className="text-sm text-foreground-muted mt-1">Organize subjects and topics for this exam.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".pdf,.txt"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={loading || isParsing || isClearing}>
            {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} Import (PDF/TXT)
          </Button>
          <Button variant="outline" className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive" onClick={handleClearSyllabus} disabled={loading || isParsing || isClearing || subjects.length === 0}>
            {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Clear
          </Button>
          <Button className="gap-2" onClick={handleAddSubject} disabled={loading || isClearing}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Subject
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {subjects.length === 0 && (
          <div className="p-8 flex flex-col items-center justify-center text-center border border-dashed rounded-xl bg-surface/50 space-y-4">
            <p className="text-foreground-muted">No subjects added yet. Add a subject to start building your syllabus.</p>
            <Button variant="outline" className="gap-2" onClick={handleAddSubject} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Subject
            </Button>
          </div>
        )}
        {subjects.map((subject) => {
          const isExpanded = expanded[subject.id];
          const totalTopics = subject.topics.length;
          const completedTopics = subject.topics.filter(t => t.status === 'COMPLETED').length;
          const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
          
          return (
            <div key={subject.id} className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-hover transition-colors group"
                onClick={() => toggle(subject.id)}
              >
                <div className="flex items-center gap-3">
                  <button className="text-foreground-muted hover:text-foreground p-1">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <h3 className="font-semibold text-foreground text-lg">{subject.name}</h3>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-32 h-2 bg-surface-elevated rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-sm font-medium text-foreground-muted tabular-nums w-8">{progress}%</span>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      className="text-foreground-muted hover:text-primary p-1 rounded" 
                      onClick={e => { e.stopPropagation(); handleEditSubject(subject); }}
                      disabled={loading}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      className="text-foreground-muted hover:text-destructive p-1 rounded" 
                      onClick={e => { e.stopPropagation(); handleDeleteSubject(subject.id); }}
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border bg-surface-elevated/30">
                  <DndContext 
                    id={`dnd-context-${subject.id}`}
                    sensors={sensors} 
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(e, subject.id)}
                  >
                    <SortableContext 
                      items={subject.topics.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {subject.topics.map((topic) => (
                        <SortableTopicItem 
                          key={topic.id} 
                          topic={topic} 
                          onEdit={handleEditTopic}
                          onDelete={(id) => handleDeleteTopic(id, subject.id)}
                          onUpdateStatus={handleUpdateTopicStatus}
                          examId={examId}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  
                  {subject.topics.length === 0 && (
                    <div className="p-4 text-center text-sm text-foreground-muted italic border-b border-border/50">
                      No topics added to this subject.
                    </div>
                  )}
                  
                  <div className="p-3 pl-12 border-t border-border/50">
                    <button 
                      className="flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-primary transition-colors disabled:opacity-50" 
                      onClick={() => handleAddTopic(subject.id)}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add Topic
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(isParsing || isImporting) && <GlobalLoader message={isParsing ? "Extracting syllabus..." : "Importing syllabus..."} />}

      {parsedPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col border border-border overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Syllabus Preview</h3>
                <p className="text-sm text-foreground-muted mt-1">
                  Found {parsedPreview.length} subjects and {parsedPreview.reduce((acc, s) => acc + s.topics.length, 0)} topics.
                </p>
              </div>
              <button 
                onClick={() => setParsedPreview(null)}
                className="text-foreground-muted hover:text-foreground p-2 rounded-full hover:bg-surface-elevated transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {parsedPreview.map((sub, i) => (
                <div key={i} className="space-y-3">
                  <h4 className="font-bold text-foreground text-lg pb-2 border-b border-border/50">{sub.name}</h4>
                  <ul className="space-y-2 pl-4">
                    {sub.topics.map((topic, j) => (
                      <li key={j} className="text-sm text-foreground-muted flex items-start gap-2">
                        <span className="text-primary mt-1">•</span> {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-border bg-surface/50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setParsedPreview(null)}>Cancel</Button>
              <Button onClick={confirmImport} disabled={isImporting}>
                {isImporting ? "Importing..." : "Confirm & Import"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
