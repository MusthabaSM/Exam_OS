"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Plus, X, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

import { updateExamAction } from "@/actions/examActions";
import { Exam, ExamStage } from "@prisma/client";
import { SmoothInput } from "@/components/ui/SmoothInput";

export default function EditExamClient({ exam }: { exam: Exam & { examStages?: ExamStage[] } }) {
  const router = useRouter();
  
  const [examName, setExamName] = useState(exam.name);
  const [org, setOrg] = useState(exam.organization || "");
  
  // Date state
  const formatDate = (date: Date | null | undefined) => date ? new Date(date).toISOString().split('T')[0] : "";
  const [examDate, setExamDate] = useState(formatDate(exam.examDate));
  const [prelimsDate, setPrelimsDate] = useState(formatDate(exam.prelimsDate));
  const [mainsDate, setMainsDate] = useState(formatDate(exam.mainsDate));
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize stages from database
  const [stages, setStages] = useState<{id?: string; name: string}[]>(
    exam.examStages && exam.examStages.length > 0
      ? exam.examStages.map(s => ({ id: s.id, name: s.name }))
      : [{ name: "Prelims" }, { name: "Mains" }]
  );

  const handleUpdate = async () => {
    if (!examName.trim()) {
      setError("Exam Name is required");
      return;
    }
    
    if (stages.some(s => !s.name.trim())) {
      setError("All stages must have a name");
      return;
    }
    
    setError("");
    setIsSubmitting(true);
    
    try {
      const response = await updateExamAction({
        id: exam.id,
        name: examName,
        organization: org || undefined,
        examDate: examDate ? new Date(examDate) : undefined,
        prelimsDate: prelimsDate ? new Date(prelimsDate) : undefined,
        mainsDate: mainsDate ? new Date(mainsDate) : undefined,
        stages: stages.map((s, idx) => ({ id: s.id, name: s.name.trim(), order: idx }))
      });
      
      if (response.success) {
        router.push(`/exams/${exam.id}`);
      } else {
        setError(response.error || "Failed to update exam");
        setIsSubmitting(false);
      }
    } catch (e) {
      console.error("Error calling updateExamAction:", e);
      setError("An unexpected error occurred: " + ((e as Error).message || "Unknown error"));
      setIsSubmitting(false);
    }
  };

  const addStage = () => {
    setStages([...stages, { name: "" }]);
  };

  const updateStage = (index: number, name: string) => {
    const newStages = [...stages];
    newStages[index].name = name;
    setStages(newStages);
  };

  const removeStage = (index: number) => {
    const newStages = [...stages];
    newStages.splice(index, 1);
    setStages(newStages);
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newStages = [...stages];
      const temp = newStages[index - 1];
      newStages[index - 1] = newStages[index];
      newStages[index] = temp;
      setStages(newStages);
    } else if (direction === 'down' && index < stages.length - 1) {
      const newStages = [...stages];
      const temp = newStages[index + 1];
      newStages[index + 1] = newStages[index];
      newStages[index] = temp;
      setStages(newStages);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <header className="space-y-2">
        <Link href={`/exams/${exam.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Exam
        </Link>
        <h1 className="text-3xl font-semibold -tracking-[0.02em] text-foreground">Edit Examination</h1>
        <p className="text-foreground-muted">Update the details for this exam.</p>
      </header>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-4 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Exam Details</h2>
            <p className="text-sm text-foreground-muted">Modify the details below.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push(`/exams/${exam.id}`)} disabled={isSubmitting}>Cancel</Button>
            <button 
              onClick={handleUpdate} 
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
          {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Exam Name *</label>
              <SmoothInput 
                type="text" 
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. IBPS Clerk 2026" 
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Organization</label>
                <SmoothInput 
                  type="text" 
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  placeholder="e.g. IBPS" 
                />
              </div>
              
              {stages.length > 1 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Prelims Date</label>
                    <input 
                      type="date" 
                      value={prelimsDate}
                      onChange={(e) => setPrelimsDate(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Mains Date</label>
                    <input 
                      type="date" 
                      value={mainsDate}
                      onChange={(e) => setMainsDate(e.target.value)}
                      className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Exam Date</label>
                  <input 
                    type="date" 
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-4">Exam Stages</h3>
            <div className="space-y-3">
              {stages.map((stage, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-border rounded-md bg-surface-elevated">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  <input 
                    type="text"
                    value={stage.name}
                    onChange={(e) => updateStage(idx, e.target.value)}
                    placeholder="e.g. Prelims, Mains, Written..."
                    className="flex-1 bg-transparent border-none text-sm font-medium text-foreground focus:outline-none"
                  />
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => moveStage(idx, 'up')} 
                      disabled={idx === 0}
                      className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface rounded-md disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => moveStage(idx, 'down')} 
                      disabled={idx === stages.length - 1}
                      className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface rounded-md disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => removeStage(idx)} 
                      className="p-1.5 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {stages.length === 0 && (
                <p className="text-sm text-foreground-muted italic py-2">No stages defined. Exam must have at least one stage.</p>
              )}
              
              <Button variant="outline" size="sm" className="w-full border-dashed mt-2" onClick={addStage}>
                <Plus className="w-4 h-4 mr-2" /> Add Stage
              </Button>
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-4 mt-8 p-4 bg-surface border border-border rounded-xl shadow-lg flex justify-end gap-3 z-10">
          <Button variant="outline" onClick={() => router.push(`/exams/${exam.id}`)} disabled={isSubmitting}>Cancel</Button>
          <button 
            onClick={handleUpdate} 
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium text-lg shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
