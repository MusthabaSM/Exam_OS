"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, CheckCircle2, Plus, Loader2, X, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LemniscateBloom } from "@/components/loading/LemniscateBloom";
import { SmoothInput } from "@/components/ui/SmoothInput";

import { createExamAction } from "@/actions/examActions";

export default function NewExamPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"manual" | "import" | null>(null);
  
  const [examName, setExamName] = useState("");
  const [org, setOrg] = useState("");
  const [examDate, setExamDate] = useState("");
  const [prelimsDate, setPrelimsDate] = useState("");
  const [mainsDate, setMainsDate] = useState("");
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [minimumQualifyingMarks, setMinimumQualifyingMarks] = useState("");
  const [error, setError] = useState("");
  
  // Stages state
  const [stages, setStages] = useState<{name: string, weightage?: string}[]>([
    { name: "Prelims" },
    { name: "Mains" }
  ]);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const handleManualCreate = async () => {
    if (!examName.trim()) {
      setError("Exam Name is required");
      return;
    }
    
    // Validate stages
    if (stages.some(s => !s.name.trim())) {
      setError("All stages must have a name");
      return;
    }
    
    setError("");
    setIsSaving(true);
    
    // Call server action
    try {
      const response = await createExamAction({
        name: examName,
        organization: org || undefined,
        examDate: examDate ? new Date(examDate) : undefined,
        prelimsDate: prelimsDate ? new Date(prelimsDate) : undefined,
        mainsDate: mainsDate ? new Date(mainsDate) : undefined,
        applicationStartDate: registrationStart ? new Date(registrationStart) : undefined,
        applicationEndDate: registrationEnd ? new Date(registrationEnd) : undefined,
        totalMarks: totalMarks ? parseInt(totalMarks) : undefined,
        minimumQualifyingMarks: minimumQualifyingMarks || undefined,
        weightageDistribution: stages.reduce((acc, stage) => {
          if (stage.name.trim() && stage.weightage?.trim()) {
            acc[stage.name.trim()] = stage.weightage.trim();
          }
          return acc;
        }, {} as Record<string, string>),
        isDevelopment: false,
        stages: stages.map((s, idx) => ({ name: s.name.trim(), order: idx }))
      });
      
      if (response.success) {
        router.push(`/exams/${response.data.id}`);
      } else {
        if (response.fieldErrors) {
          const errors = Object.entries(response.fieldErrors)
            .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
            .join(' | ');
          setError(`Validation failed: ${errors}`);
        } else {
          setError(response.error || "Failed to create exam");
        }
        setIsSaving(false);
      }
    } catch (e) {
      console.error("Error calling createExamAction:", e);
      setError("An unexpected error occurred: " + ((e as Error).message || "Unknown error"));
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsProcessing(true);
      setError("");
      
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/exams/parse-notification", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Failed to parse PDF");
        }

        const data = await res.json();
        
        // Auto-fill form fields
        if (data.name) setExamName(data.name);
        if (data.org) setOrg(data.org);
        if (data.examDate) setExamDate(data.examDate);
        if (data.prelimsDate) setPrelimsDate(data.prelimsDate);
        if (data.mainsDate) setMainsDate(data.mainsDate);
        if (data.registrationStart) setRegistrationStart(data.registrationStart);
        if (data.registrationEnd) setRegistrationEnd(data.registrationEnd);
        if (data.totalMarks) setTotalMarks(data.totalMarks);
        if (data.minimumQualifyingMarks) setMinimumQualifyingMarks(data.minimumQualifyingMarks);
        if (data.stages && data.stages.length > 0) setStages(data.stages);
        
        // Switch to manual mode to let user review
        setIsProcessing(false);
        setMethod("manual");
        
      } catch (e) {
        console.error("Error parsing PDF:", e);
        setError("Failed to extract details from the PDF. Please enter them manually.");
        setIsProcessing(false);
        setMethod("manual");
      }
    }
  };

  const addStage = () => {
    setStages([...stages, { name: "" }]);
  };

  const updateStage = (index: number, field: 'name' | 'weightage', value: string) => {
    const newStages = [...stages];
    newStages[index][field] = value;
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
    <div className="max-w-3xl mx-auto space-y-8">
      <header className="space-y-2">
        <Link href="/exams" className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Exams
        </Link>
        <h1 className="text-3xl font-semibold -tracking-[0.02em] text-foreground">Add Examination</h1>
        <p className="text-foreground-muted">Choose how you want to add this exam to your workspace.</p>
      </header>

      {!method ? (
        <div className="grid sm:grid-cols-2 gap-6">
          <button 
            onClick={() => setMethod("import")}
            className="flex flex-col items-center text-center p-8 bg-surface border border-border rounded-xl shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Import Notification</h3>
            <p className="text-sm text-foreground-muted">
              Upload an official PDF notification. We will automatically extract dates, syllabus, and exam pattern.
            </p>
            <span className="mt-6 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">
              Recommended
            </span>
          </button>

          <button 
            onClick={() => setMethod("manual")}
            className="flex flex-col items-center text-center p-8 bg-surface border border-border rounded-xl shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
          >
            <div className="w-16 h-16 rounded-full bg-surface-elevated border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-8 h-8 text-foreground-muted group-hover:text-foreground transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Create Manually</h3>
            <p className="text-sm text-foreground-muted">
              Enter exam details manually. You can add the syllabus and dates yourself.
            </p>
          </button>
        </div>
      ) : method === "import" ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-8 border-2 border-dashed border-border rounded-xl bg-surface flex flex-col items-center justify-center text-center min-h-[300px]">
            {isProcessing ? (
              <div className="text-primary mb-4">
                <LemniscateBloom size={100} />
              </div>
            ) : (
              <Upload className="w-10 h-10 text-foreground-muted mb-4" />
            )}
            <h3 className="text-lg font-medium text-foreground mb-1">
              {isProcessing ? (
                <span className="animate-pulse">Extracting document text...</span>
              ) : "Upload Official Notification"}
            </h3>
            <p className="text-sm text-foreground-muted mb-6">
              {isProcessing ? "Parsing syllabus and exam pattern..." : "Drag and drop a PDF file here, or click to browse."}
            </p>
            <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            {!isProcessing && (
              <Button onClick={() => fileInputRef.current?.click()}>
                Choose PDF File
              </Button>
            )}
            <p className="text-xs text-foreground-muted mt-4">DEMO: Extracts to a dummy exam using local storage.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setMethod(null)} disabled={isProcessing}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="flex items-center justify-between bg-surface border border-border rounded-xl p-4 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Manual Entry</h2>
              <p className="text-sm text-foreground-muted">Fill in the details below to create your exam.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setMethod(null)}>Cancel</Button>
              <Button 
                onClick={handleManualCreate} 
                disabled={isSaving}
                className="min-w-[120px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Exam"
                )}
              </Button>
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

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Registration Start</label>
                  <input 
                    type="date" 
                    value={registrationStart}
                    onChange={(e) => setRegistrationStart(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Registration End</label>
                  <input 
                    type="date" 
                    value={registrationEnd}
                    onChange={(e) => setRegistrationEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Total Marks</label>
                <SmoothInput 
                  type="number" 
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  placeholder="e.g. 100" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Minimum Qualifying Marks</label>
                <SmoothInput 
                  type="text" 
                  value={minimumQualifyingMarks}
                  onChange={(e) => setMinimumQualifyingMarks(e.target.value)}
                  placeholder="e.g. 33% or 120 marks" 
                />
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
                      onChange={(e) => updateStage(idx, 'name', e.target.value)}
                      placeholder="e.g. Prelims, Mains..."
                      className="flex-1 bg-transparent border-none text-sm font-medium text-foreground focus:outline-none min-w-[120px]"
                    />
                    <div className="w-px h-6 bg-border mx-2 hidden sm:block"></div>
                    <input 
                      type="text"
                      value={stage.weightage || ""}
                      onChange={(e) => updateStage(idx, 'weightage', e.target.value)}
                      placeholder="Weightage (e.g. 70%)"
                      className="flex-1 bg-transparent border-none text-sm font-medium text-foreground focus:outline-none min-w-[120px]"
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
            <Button variant="outline" onClick={() => setMethod(null)}>Cancel</Button>
            <Button 
              onClick={handleManualCreate} 
              disabled={isSaving}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Exam"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
