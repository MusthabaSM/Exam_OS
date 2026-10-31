'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUp, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { importAndStartAttemptAction, importQuestionsAction } from '@/actions/practiceActions';
import { LemniscateBloom } from '@/components/loading/LemniscateBloom';

export default function ImportClient({ examId, subjects }: { examId: string; subjects: any[] }) {
  const router = useRouter();
  
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [timeLimit, setTimeLimit] = useState<number>(0);
  const [importMode, setImportMode] = useState<'test' | 'save'>('test');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'EXTRACTING' | 'SAVING' | 'PREPARING'>('IDLE');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError('');
    setStatus('EXTRACTING');

    try {
      const formData = new FormData();
      formData.append('file', selected);

      const res = await fetch(`/api/exams/${examId}/practice/parse-questions`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Extraction failed');
      }

      // Automatically filter out invalid questions
      const validQuestions = (data.questions || []).filter((q: any) => q.status === "VALID");
      
      if (validQuestions.length === 0) {
        const total = (data.questions || []).length;
        if (total > 0) {
          const firstIssue = data.questions[0].issues?.join(', ') || 'Missing correct answer or exactly 4 options';
          throw new Error(`Found ${total} questions, but none were perfectly valid. Example issue: ${firstIssue}`);
        }
        throw new Error("No valid questions could be extracted from this file.");
      }

      setStatus('SAVING');

      if (importMode === 'test') {
        const actionRes = await importAndStartAttemptAction(
          examId, 
          selectedSubjectId || null, 
          selectedTopicId || null, 
          validQuestions
        );
        
        if (!actionRes.success) {
          throw new Error(actionRes.error || 'Failed to save questions');
        }
        
        if (!actionRes.data) {
          throw new Error('No attempt ID returned');
        }

        setStatus('PREPARING');

        // Redirect immediately to the test runner
        router.push(`/exams/${examId}/practice/test/${actionRes.data.attemptId}${timeLimit > 0 ? `?timeLimit=${timeLimit}` : ''}`);
      } else {
        const actionRes = await importQuestionsAction(
          examId, 
          selectedSubjectId || null, 
          selectedTopicId || null, 
          validQuestions
        );
        
        if (!actionRes.success) {
          throw new Error(actionRes.error || 'Failed to save questions');
        }
        
        // Redirect to practice center home
        router.push(`/exams/${examId}/practice`);
      }

    } catch (err: any) {
      setError(err.message);
      setStatus('IDLE');
    }
  };

  if (status !== 'IDLE') {
    return (
      <Card className="p-12 text-center space-y-6">
        <LemniscateBloom size={120} />
        <h3 className="text-xl font-medium text-gray-900 mt-4">
          {status === 'EXTRACTING' && 'Extracting questions...'}
          {status === 'SAVING' && 'Saving question bank...'}
          {status === 'PREPARING' && 'Preparing practice test...'}
        </h3>
        <p className="text-sm text-gray-500">Please do not refresh the page.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-start gap-2 border border-red-200">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <Card className="p-12 text-center border-dashed">
        <FileUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Question Bank</h3>
        <p className="text-sm text-gray-500 mb-6">Upload a PDF or TXT containing questions and their answer key.</p>
        
        <div className="flex flex-col gap-4 max-w-sm mx-auto mb-6 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select 
              className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedTopicId('');
              }}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <select 
              className="w-full border rounded-md px-3 py-2 text-sm bg-white disabled:bg-gray-100 disabled:text-gray-400"
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              disabled={!selectedSubjectId}
            >
              <option value="">All Topics (Optional)</option>
              {subjects.find(s => s.id === selectedSubjectId)?.topics?.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">After Import</label>
            <div className="flex gap-4 items-center mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="importMode" 
                  value="test" 
                  checked={importMode === 'test'} 
                  onChange={() => setImportMode('test')} 
                  className="accent-primary"
                />
                <span className="text-sm">Take Test Now</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="importMode" 
                  value="save" 
                  checked={importMode === 'save'} 
                  onChange={() => setImportMode('save')} 
                  className="accent-primary"
                />
                <span className="text-sm">Just Save Questions</span>
              </label>
            </div>
          </div>

          {importMode === 'test' && (
            <div className="animate-in fade-in slide-in-from-top-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (mins)</label>
              <select 
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
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
          )}
        </div>

        <div className="relative inline-block">
          <Button variant="default">
            Upload Question Bank
          </Button>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </Card>
    </div>
  );
}
