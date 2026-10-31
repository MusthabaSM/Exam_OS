'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResultClient({ attempt }: { attempt: any }) {
  const {
    score,
    accuracy,
    correctAnswers,
    wrongAnswers,
    skippedAnswers,
    totalQuestions,
    durationSeconds,
    answers,
    examId
  } = attempt;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Metrics Card */}
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500 font-medium">Score</p>
            <p className="text-2xl font-bold text-[#4A78E0]">{score}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Accuracy</p>
            <p className="text-2xl font-bold text-gray-900">{Math.round(accuracy)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Correct</p>
            <p className="text-2xl font-bold text-green-600">{correctAnswers}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Incorrect</p>
            <p className="text-2xl font-bold text-red-600">{wrongAnswers}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Skipped</p>
            <p className="text-2xl font-bold text-amber-500">{skippedAnswers}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Time Taken</p>
            <p className="text-2xl font-bold text-gray-900">{formatTime(durationSeconds || 0)}</p>
          </div>
        </div>
      </Card>

      <h2 className="text-xl font-bold text-gray-900 pt-4">Question Review</h2>

      <div className="space-y-6">
        {answers.map((answer: any, index: number) => {
          const q = answer.question;
          const isCorrect = answer.isCorrect;
          const isSkipped = !answer.selectedAnswer;

          return (
            <Card key={answer.id} className="p-6 border-t-4" style={{ borderTopColor: isSkipped ? '#f59e0b' : (isCorrect ? '#16a34a' : '#dc2626') }}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Question {index + 1}</h3>
                  <p className="text-gray-800 whitespace-pre-wrap mb-4">{q.question}</p>
                  
                  <div className="space-y-2 mb-6">
                    {q.options.map((opt: any, i: number) => {
                      const isObject = typeof opt === 'object' && opt !== null && 'key' in opt;
                      const optText = isObject ? `${opt.key}. ${opt.text}` : opt;
                      return (
                        <div key={i} className="p-3 border rounded-md bg-gray-50 text-gray-700">
                          {optText}
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Your Answer:</p>
                      <div className="flex items-center gap-2">
                        {isSkipped ? (
                          <>
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <span className="text-amber-700 font-medium">Not Answered</span>
                          </>
                        ) : (
                          <>
                            {isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                              {(() => {
                                const opt = q.options.find((o: any) => typeof o === 'object' && o.key === answer.selectedAnswer);
                                return opt ? `${opt.key}. ${opt.text}` : answer.selectedAnswer;
                              })()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Original Answer:</p>
                      <p className="text-gray-900 font-medium">
                        {(() => {
                          const opt = q.options.find((o: any) => typeof o === 'object' && o.key === q.correctAnswer);
                          return opt ? `${opt.key}. ${opt.text}` : q.correctAnswer;
                        })()}
                      </p>
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg text-blue-900 text-sm">
                      <span className="font-semibold block mb-1">Explanation:</span>
                      {q.explanation}
                    </div>
                  )}

                  <div className="mt-4 flex items-center text-xs text-gray-500 gap-3 border-t pt-3">
                    <span className="font-medium text-gray-700">Source:</span>
                    {q.sourceDocument ? (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {q.sourceDocument.name} — {q.sourcePageNumber ? `Page ${q.sourcePageNumber}` : 'Source page unavailable'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {q.sourcePageNumber ? `Page ${q.sourcePageNumber}` : 'Source page unavailable'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      <div className="pt-4 flex justify-start">
         <Link href={`/exams/${examId}/practice`}>
           <Button variant="outline" className="flex items-center gap-2">
             <ArrowLeft className="w-4 h-4" />
             Back to Practice Center
           </Button>
         </Link>
      </div>
    </div>
  );
}
