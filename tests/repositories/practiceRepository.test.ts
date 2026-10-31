import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import prisma from '../../src/lib/db/prisma';
import { practiceRepository } from '../../src/lib/repositories/practiceRepository';

describe('practiceRepository Security', () => {
  let userId = 'test-user-practice-sec';
  let examId: string;
  let attemptId: string;
  let completedAttemptId: string;
  let q1Id: string;

  beforeAll(async () => {
    // Setup test data
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: 'practice-sec@example.com',
        name: 'Practice Sec User'
      }
    });

    const exam = await prisma.exam.create({
      data: {
        id: 'test-exam-practice-sec',
        user: { connect: { id: user.id } },
        name: 'Practice Sec Exam',
        examDate: new Date(),
      }
    });
    examId = exam.id;

    const subject = await prisma.subject.create({
      data: { name: 'Sec Subject', examId, order: 1 }
    });

    const topic = await prisma.topic.create({
      data: { name: 'Sec Topic', subjectId: subject.id, order: 1 }
    });

    const q1 = await prisma.practiceQuestion.create({
      data: {
        examId,
        subjectId: subject.id,
        topicId: topic.id,
        question: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 'B',
        explanation: 'Basic math',
        difficulty: 'EASY',
      }
    });
    q1Id = q1.id;
  });

  afterAll(async () => {
    await prisma.practiceAttempt.deleteMany({ where: { userId } });
    await prisma.exam.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it('active attempt excludes correctAnswer and explanation', async () => {
    const attempt = await practiceRepository.startAttempt(userId, examId, [q1Id]);
    attemptId = attempt.id;

    const details = await practiceRepository.getAttemptDetails(userId, attemptId);
    expect(details).toBeDefined();
    expect(details?.completedAt).toBeNull();
    
    const ans = details?.answers[0];
    expect(ans).toBeDefined();
    expect(ans?.question).toBeDefined();
    expect(ans?.question.question).toBe('What is 2+2?');
    // Security checks
    expect(ans?.question.correctAnswer).toBeUndefined();
    expect(ans?.question.explanation).toBeUndefined();
  });

  it('completed attempt includes correctAnswer and explanation for review', async () => {
    // Complete it
    await practiceRepository.completeAttempt(userId, attemptId);
    
    const details = await practiceRepository.getAttemptDetails(userId, attemptId);
    expect(details).toBeDefined();
    expect(details?.completedAt).not.toBeNull();
    
    const ans = details?.answers[0];
    expect(ans?.question.correctAnswer).toBe('B');
    expect(ans?.question.explanation).toBe('Basic math');
  });

  it('cross-user attempt access is rejected', async () => {
    const details = await practiceRepository.getAttemptDetails('another-user', attemptId);
    expect(details).toBeNull();
  });
});
