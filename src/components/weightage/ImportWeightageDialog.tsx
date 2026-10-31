'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUp, Info, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { MatchedExamWeightage } from '@/lib/weightage-import/matcher';
import { LemniscateBloom } from '@/components/loading/LemniscateBloom';
import { saveTopicWeightages } from '@/app/exams/[examId]/topic-weightage/actions';
import { useRouter } from 'next/navigation';

interface ImportWeightageDialogProps {
  examId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ImportWeightageDialog({ examId, isOpen, onOpenChange, onSuccess }: ImportWeightageDialogProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState<{ sourceYear: string | null, exams: MatchedExamWeightage[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setParsedData(null); // Reset when new file selected
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsParsing(true);
    setParsedData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/exams/${examId}/parse-weightage`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to parse file');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setParsedData(result.data);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'An error occurred during extraction');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;

    setIsSaving(true);
    try {
      const { imported, skipped } = await saveTopicWeightages(parsedData.sourceYear || null, parsedData.exams);
      alert(`Import successful: ${imported} records imported, ${skipped} duplicates skipped.`);
      onSuccess();
      onOpenChange(false);
      
      // reset state for next time
      setFile(null);
      setParsedData(null);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to save weightage data');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setParsedData(null);
  };

  // Helper to calculate summary stats
  let totalMatched = 0;
  let totalUnmatched = 0;

  if (parsedData?.exams) {
    parsedData.exams.forEach(exam => {
      exam.subjects.forEach(subject => {
        if (subject.isMatched) totalMatched++;
        else totalUnmatched++;

        subject.topics.forEach(topic => {
          if (topic.isMatched) totalMatched++;
          else totalUnmatched++;
        });
      });
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>WEIGHTAGE IMPORT</DialogTitle>
          <DialogDescription>
            Deterministic Multi-Exam PDF Extractor
          </DialogDescription>
        </DialogHeader>

        {!parsedData ? (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-background/50 transition-colors">
              <input
                type="file"
                id="weightage-file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="weightage-file"
                className="cursor-pointer flex flex-col items-center justify-center w-full h-full"
              >
                <FileText className="w-10 h-10 text-primary mb-3" />
                <span className="text-sm font-medium text-foreground mb-1">
                  {file ? file.name : "Select Multi-Exam PDF"}
                </span>
              </label>
            </div>
            
            {isParsing ? (
               <div className="flex flex-col items-center justify-center py-6">
                  <LemniscateBloom size={40} />
                  <p className="text-sm text-foreground-muted font-medium mt-4">Extracting... Matching... Preparing preview...</p>
               </div>
            ) : (
               <div className="flex justify-end">
                 <Button 
                   onClick={handleExtract} 
                   disabled={!file}
                   className="w-full"
                 >
                   <FileUp className="w-4 h-4 mr-2" />
                   Extract
                 </Button>
               </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-surface rounded-xl p-4 border border-border space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Source: {file?.name || 'Uploaded Document'}</span>
              </div>
              
              <h3 className="text-sm font-bold tracking-widest text-foreground-muted uppercase">Exams Found</h3>
              
              <div className="space-y-4">
                {parsedData.exams.map((exam, i) => {
                  let eMat = 0;
                  let eUnm = 0;
                  let tCount = 0;
                  exam.subjects.forEach(s => {
                    if (s.isMatched) eMat++; else eUnm++;
                    s.topics.forEach(t => {
                      tCount++;
                      if (t.isMatched) eMat++; else eUnm++;
                    });
                  });

                  if (!exam.isMatched) {
                    return (
                      <div key={i} className="pl-3 border-l-2 border-destructive/50">
                        <div className="font-semibold text-foreground">{exam.examName}</div>
                        <div className="text-xs text-destructive font-medium mt-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Unrecognized Exam Section
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={i} className="pl-3 border-l-2 border-primary/50">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        {exam.examName} 
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                      <div className="text-sm text-foreground-muted grid grid-cols-2 mt-1 gap-1">
                        <div>Subjects: {exam.subjects.length}</div>
                        <div>Topics: {tCount}</div>
                        <div className="text-success/90 font-medium">Matched: {eMat}</div>
                        <div className="text-destructive/90 font-medium">Unmatched: {eUnm}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 mt-2 border-t border-border grid grid-cols-2 text-sm">
                <div>
                  <span className="text-foreground-muted">Total matched:</span>
                  <div className="text-xl font-bold text-success">{totalMatched}</div>
                </div>
                <div>
                  <span className="text-foreground-muted">Total unmatched:</span>
                  <div className="text-xl font-bold text-destructive">{totalUnmatched}</div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetForm} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isSaving || totalMatched === 0}>
                {isSaving ? "Saving..." : `Import Data`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
