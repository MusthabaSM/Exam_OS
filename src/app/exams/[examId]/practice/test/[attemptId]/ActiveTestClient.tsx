'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Flag, Clock } from 'lucide-react';
import { submitPracticeAnswerAction, completePracticeAttemptAction } from '@/actions/practiceActions';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ActiveTestClient({ 
  examId, 
  attempt 
}: { 
  examId: string, 
  attempt: any 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timeLimitParam = searchParams.get('timeLimit');
  
  // Sort answers by question ID deterministically just in case
  const sortedAnswers = React.useMemo(() => {
    return [...(attempt.answers || [])].sort((a: any, b: any) => a.questionId.localeCompare(b.questionId));
  }, [attempt.answers]);
  
  const [answers, setAnswers] = useState<Record<string, { selected: string, review: boolean }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time limit logic
  const initialTimeLeft = timeLimitParam ? parseInt(timeLimitParam, 10) * 60 : 0;
  const [timeLeft, setTimeLeft] = useState<number | null>(initialTimeLeft > 0 ? initialTimeLeft : null);
  const handleCompleteRef = useRef<() => void>(undefined);

  // Initialize local state from server data (refresh-safe)
  useEffect(() => {
    const initialAnswers: Record<string, { selected: string, review: boolean }> = {};
    sortedAnswers.forEach(ans => {
      initialAnswers[ans.questionId] = {
        selected: ans.selectedAnswer || '',
        review: ans.markedForReview || false
      };
    });
    setAnswers(initialAnswers);
  }, [attempt, sortedAnswers]);

  const handleSelect = async (qid: string, optionKey: string) => {
    const isReview = answers[qid]?.review || false;
    
    // Optimistic UI update
    setAnswers(prev => ({ ...prev, [qid]: { selected: optionKey, review: isReview } }));
    
    // Server-side persistence
    await submitPracticeAnswerAction({
      attemptId: attempt.id,
      questionId: qid,
      selectedAnswer: optionKey,
      markedForReview: isReview
    });
  };

  const toggleReview = async (qid: string) => {
    const currentSelected = answers[qid]?.selected || '';
    const newReview = !(answers[qid]?.review);
    
    // Optimistic UI update
    setAnswers(prev => ({ ...prev, [qid]: { selected: currentSelected, review: newReview } }));
    
    // Server-side persistence
    await submitPracticeAnswerAction({
      attemptId: attempt.id,
      questionId: qid,
      selectedAnswer: currentSelected || null,
      markedForReview: newReview
    });
  };

  const handleComplete = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await completePracticeAttemptAction(attempt.id, examId);
      router.push(`/exams/${examId}/practice/result/${attempt.id}`);
    } catch (e) {
      alert("Failed to submit test. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Keep ref updated for the interval
  useEffect(() => {
    handleCompleteRef.current = handleComplete;
  }, [handleComplete]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft === null) return;
    
    if (timeLeft <= 0) {
      // Time is up!
      if (handleCompleteRef.current) {
        handleCompleteRef.current();
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev !== null ? prev - 1 : null);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.values(answers).filter(a => a.selected).length;
  const totalQuestions = sortedAnswers.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header */}
      <div className="sticky top-4 z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700 font-medium">
            <span className="text-primary font-bold">{answeredCount}</span> of {totalQuestions} answered
          </div>
          
          {timeLeft !== null && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-sm
              ${timeLeft < 60 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-orange-50 text-orange-700'}
            `}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="default" 
            className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 gap-2 shadow-sm"
            onClick={handleComplete}
            disabled={isSubmitting}
          >
            <CheckCircle className="w-4 h-4" />
            Finish Test
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-8 mt-6">
        {sortedAnswers.map((ans, index) => {
          const question = ans.question;
          if (!question) return null;

          return (
            <Card key={question.id} className="overflow-hidden shadow-sm border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <span className="font-bold text-gray-400 mt-0.5 select-none">{index + 1}.</span>
                    <h2 className="text-lg font-medium text-gray-900 leading-relaxed max-w-3xl whitespace-pre-wrap">
                      {question.question}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex-shrink-0 ml-4 ${answers[question.id]?.review ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50/50'}`}
                    onClick={() => toggleReview(question.id)}
                    title="Mark for review"
                  >
                    <Flag className={`w-5 h-5 ${answers[question.id]?.review ? 'fill-current' : ''}`} />
                  </Button>
                </div>

                <div className="space-y-3 pl-8 md:pl-10">
                  {Array.isArray(question.options) && question.options.map((opt: any) => {
                    const isSelected = answers[question.id]?.selected === opt.key;
                    
                    return (
                      <button
                        key={opt.key}
                        onClick={() => handleSelect(question.id, opt.key)}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center group
                          ${isSelected 
                            ? 'bg-primary/5 border-primary shadow-[0_0_0_1px_rgba(74,120,224,1)]' 
                            : 'bg-white border-gray-200 border hover:border-primary/40 hover:bg-gray-50'
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium mr-4 transition-colors flex-shrink-0
                          ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-primary/10 group-hover:text-primary'}
                        `}>
                          {opt.key}
                        </div>
                        <span className={`text-base ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      {/* Bottom Finish Button */}
      <div className="flex justify-center pt-8 pb-4">
         <Button 
            variant="default" 
            size="lg"
            className="bg-green-600 hover:bg-green-700 gap-2 px-8"
            onClick={handleComplete}
            disabled={isSubmitting}
          >
            <CheckCircle className="w-5 h-5" />
            Submit & Finish Test
          </Button>
      </div>

    </div>
  );
}
