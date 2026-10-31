import { z } from 'zod';
import { Difficulty } from '@prisma/client';

export const createPracticeQuestionSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjectId: z.string().nullable().optional(),
  topicId: z.string().nullable().optional(),
  question: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).min(2, 'At least 2 options are required'),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().nullable().optional(),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
}).refine(data => data.options.includes(data.correctAnswer), {
  message: "Correct answer must be one of the options",
  path: ["correctAnswer"]
});

export type CreatePracticeQuestionInput = z.infer<typeof createPracticeQuestionSchema>;

export const startPracticeAttemptSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  subjectIds: z.array(z.string()).optional(),
  topicIds: z.array(z.string()).optional(),
  documentIds: z.array(z.string()).optional(),
  questionIds: z.array(z.string()).min(1, 'At least 1 question is required'),
});

export type StartPracticeAttemptInput = z.infer<typeof startPracticeAttemptSchema>;

export const submitPracticeAnswerSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
  questionId: z.string().min(1, 'Question ID is required'),
  selectedAnswer: z.string().nullable().optional(),
  markedForReview: z.boolean().default(false),
});

export type SubmitPracticeAnswerInput = z.infer<typeof submitPracticeAnswerSchema>;
