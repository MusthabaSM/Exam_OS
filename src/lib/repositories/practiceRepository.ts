import prisma from '../db/prisma';
import { PracticeAttempt, PracticeAnswer, PracticeQuestion, Difficulty } from '@prisma/client';
import { CreatePracticeQuestionInput, StartPracticeAttemptInput, SubmitPracticeAnswerInput } from '../validation/practiceSchemas';

export const practiceRepository = {
  getQuestionsForAttempt: async (examId: string, subjectIds?: string[], topicIds?: string[], documentIds?: string[], limit: number = 20): Promise<PracticeQuestion[]> => {
    // 1. Fetch matching question IDs
    const matchingIds = await prisma.practiceQuestion.findMany({
      where: {
        examId,
        ...(subjectIds && subjectIds.length > 0 ? { subjectId: { in: subjectIds } } : {}),
        ...(topicIds && topicIds.length > 0 ? { topicId: { in: topicIds } } : {}),
        ...(documentIds && documentIds.length > 0 ? { sourceDocumentId: { in: documentIds } } : {}),
      },
      select: { id: true }
    });

    if (matchingIds.length === 0) return [];

    // 2. Shuffle IDs randomly
    const shuffled = matchingIds.sort(() => 0.5 - Math.random());
    const selectedIds = shuffled.slice(0, limit).map(q => q.id);

    // 3. Fetch the full questions for the selected IDs
    // Note: 'in' query might not preserve the shuffled order, so we can shuffle them again locally if needed,
    // or just return them as they are since the selection itself is random.
    const questions = await prisma.practiceQuestion.findMany({
      where: { id: { in: selectedIds } }
    });
    
    // Sort locally to match the randomly selected order
    return selectedIds.map(id => questions.find(q => q.id === id)!).filter(Boolean);
  },

  createPracticeQuestion: async (examId: string, data: CreatePracticeQuestionInput): Promise<PracticeQuestion> => {
    return prisma.practiceQuestion.create({
      data: {
        examId,
        subjectId: data.subjectId,
        topicId: data.topicId,
        question: data.question,
        options: data.options,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        difficulty: data.difficulty,
      },
    });
  },

  bulkInsertQuestions: async (
    userId: string, 
    examId: string, 
    questions: { 
      subjectId: string | null, 
      topicId: string | null, 
      questionText: string, 
      options: { key: string, text: string }[], 
      correctAnswer: string, 
      explanation: string | null, 
      sourceDocumentId: string | null, 
      sourcePage: number | null 
    }[]
  ) => {
    const exam = await prisma.exam.findFirst({
      where: { id: examId, userId },
    });
    if (!exam) throw new Error('Unauthorized');
    
    if (questions.length === 0) return { imported: 0, skipped: 0, allQuestionIds: [], questions: [] };

    // Check subject and topic ownership if they are provided in the first question
    const firstQ = questions[0];
    if (firstQ.subjectId) {
       const subject = await prisma.subject.findFirst({
          where: { id: firstQ.subjectId, examId }
       });
       if (!subject) throw new Error('Unauthorized Subject');
    }
    if (firstQ.topicId) {
       const topic = await prisma.topic.findFirst({
          where: { id: firstQ.topicId, subjectId: firstQ.subjectId || undefined }
       });
       if (!topic) throw new Error('Unauthorized Topic');
    }

    // Fetch existing questions for duplicate detection
    const existingQs = await prisma.practiceQuestion.findMany({
      where: {
        examId,
        subjectId: firstQ.subjectId,
        topicId: firstQ.topicId
      }
    });

    const normalizeString = (s: any) => (s || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

    const createFingerprint = (qText: string, opts: any) => {
      let fp = normalizeString(qText);
      if (Array.isArray(opts)) {
        opts.forEach(o => {
          fp += normalizeString(o?.key) + normalizeString(o?.text || o);
        });
      }
      return fp;
    };

    const fpToId = new Map(
      existingQs.map(eq => [createFingerprint(eq.question, eq.options as any[]), eq.id])
    );

    let imported = 0;
    let skipped = 0;
    const toInsert: typeof questions = [];
    const orderedFingerprints: string[] = [];

    for (const q of questions) {
      const fp = createFingerprint(q.questionText, q.options);
      orderedFingerprints.push(fp);
      
      if (fpToId.has(fp)) {
        skipped++;
      } else {
        // Track locally to avoid duplicates in the same batch
        fpToId.set(fp, 'PENDING');
        toInsert.push(q);
      }
    }

    const toInsertData = toInsert.map((q) => {
      const newId = crypto.randomUUID();
      return {
        id: newId,
        examId,
        subjectId: q.subjectId,
        topicId: q.topicId,
        question: q.questionText,
        options: q.options as any,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: 'MEDIUM' as const,
        sourceDocumentId: q.sourceDocumentId,
        sourcePageNumber: q.sourcePage,
      };
    });

    if (toInsertData.length > 0) {
      await prisma.practiceQuestion.createMany({
        data: toInsertData,
      });
    }

    imported = toInsertData.length;
    
    // Update fpToId with actual inserted IDs
    toInsertData.forEach(r => {
      const fp = createFingerprint(r.question, r.options as any[]);
      fpToId.set(fp, r.id);
    });

    const allQuestionIds = Array.from(new Set(
      orderedFingerprints.map(fp => fpToId.get(fp)!).filter(id => id !== 'PENDING')
    ));
    
    return { imported, skipped, allQuestionIds, questions: toInsertData as any[] };
  },

  startAttempt: async (userId: string, examId: string, questionIds: string[]): Promise<PracticeAttempt> => {
    // Verify exam ownership/access
    const exam = await prisma.exam.findFirst({
      where: { id: examId, userId },
    });
    if (!exam) throw new Error('Unauthorized or Exam not found');

    const attempt = await prisma.practiceAttempt.create({
      data: {
        userId,
        examId,
        totalQuestions: questionIds.length,
        startedAt: new Date(),
      },
    });

    // Create empty PracticeAnswer records to link the specific questions to the attempt
    await prisma.practiceAnswer.createMany({
      data: questionIds.map(qid => ({
        attemptId: attempt.id,
        questionId: qid,
      }))
    });

    return attempt;
  },

  submitAnswer: async (userId: string, attemptId: string, data: SubmitPracticeAnswerInput): Promise<PracticeAnswer> => {
    // Verify ownership of the attempt
    const attempt = await prisma.practiceAttempt.findFirst({
      where: { id: attemptId, userId, completedAt: null },
    });
    
    if (!attempt) throw new Error('Unauthorized, attempt not found, or attempt already completed');

    const question = await prisma.practiceQuestion.findUnique({
      where: { id: data.questionId },
    });

    if (!question) throw new Error('Question not found');

    const isCorrect = data.selectedAnswer === question.correctAnswer;

    // Upsert answer in case they change their selection before completion
    return prisma.practiceAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: data.attemptId,
          questionId: data.questionId,
        },
      },
      update: {
        selectedAnswer: data.selectedAnswer,
        isCorrect: isCorrect,
        markedForReview: data.markedForReview,
      },
      create: {
        attemptId: data.attemptId,
        questionId: data.questionId,
        selectedAnswer: data.selectedAnswer,
        isCorrect: isCorrect,
        markedForReview: data.markedForReview,
      },
    });
  },

  completeAttempt: async (userId: string, attemptId: string): Promise<PracticeAttempt> => {
    // Verify ownership and get the attempt
    const attempt = await prisma.practiceAttempt.findFirst({
      where: { id: attemptId, userId, completedAt: null },
      include: { answers: true },
    });

    if (!attempt) throw new Error('Unauthorized or Attempt already completed');

    const completedAt = new Date();
    const durationSeconds = Math.floor((completedAt.getTime() - attempt.startedAt.getTime()) / 1000);

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let skippedAnswers = 0;

    // Server-side calculation
    for (const answer of attempt.answers) {
      if (!answer.selectedAnswer) {
        skippedAnswers++;
      } else if (answer.isCorrect) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }
    }

    // Questions without an answer record are skipped
    skippedAnswers += (attempt.totalQuestions - attempt.answers.length);

    // Assuming +1 for correct, -0.25 for wrong as a default scoring logic
    const score = correctAnswers * 1.0 - wrongAnswers * 0.25;
    
    const answeredCount = correctAnswers + wrongAnswers;
    const accuracy = answeredCount > 0 ? (correctAnswers / answeredCount) * 100 : 0;

    return prisma.practiceAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt,
        durationSeconds,
        correctAnswers,
        wrongAnswers,
        skippedAnswers,
        score,
        accuracy,
      },
    });
  },

  getAttempts: async (userId: string, examId: string): Promise<PracticeAttempt[]> => {
    return prisma.practiceAttempt.findMany({
      where: { userId, examId },
      orderBy: { startedAt: 'desc' },
      include: {
        answers: true
      }
    });
  },
  
  getAttemptDetails: async (userId: string, attemptId: string): Promise<any | null> => {
    // Check if attempt is completed first to determine safe projection
    const attemptBase = await prisma.practiceAttempt.findFirst({
      where: { id: attemptId, userId },
      select: { completedAt: true }
    });

    if (!attemptBase) return null;

    if (attemptBase.completedAt) {
      // Completed - return everything for review
      return prisma.practiceAttempt.findFirst({
        where: { id: attemptId, userId },
        include: {
          answers: {
            include: {
              question: true
            }
          }
        }
      });
    }

    // Active - safe DTO select
    return prisma.practiceAttempt.findFirst({
      where: { id: attemptId, userId },
      include: {
        answers: {
          select: {
            id: true,
            attemptId: true,
            questionId: true,
            selectedAnswer: true,
            isCorrect: true,
            markedForReview: true,
            createdAt: true,
            question: {
              select: {
                id: true,
                examId: true,
                subjectId: true,
                topicId: true,
                question: true,
                options: true,
                difficulty: true,
                createdAt: true,
                updatedAt: true
                // EXPLICITLY OMITTING correctAnswer AND explanation
              }
            }
          }
        }
      }
    });
  }
};
