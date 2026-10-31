import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import prisma from '../../src/lib/db/prisma';
import { syllabusRepository } from '../../src/lib/repositories/syllabusRepository';
import { Difficulty, TopicStatus } from '@prisma/client';

describe('Syllabus Repository', () => {
  let userId: string;
  let otherUserId: string;
  let examId: string;
  let subjectId: string;
  let topicId: string;

  beforeEach(async () => {
    // 1. Create a user
    const user = await prisma.user.create({
      data: { email: `test-syllabus-${Date.now()}@example.com`, name: 'Test User' },
    });
    userId = user.id;

    const otherUser = await prisma.user.create({
      data: { email: `test-syllabus-other-${Date.now()}@example.com`, name: 'Other User' },
    });
    otherUserId = otherUser.id;

    // 2. Create an exam
    const exam = await prisma.exam.create({
      data: {
        userId,
        name: 'Test Exam Syllabus',
        isDevelopment: true,
      },
    });
    examId = exam.id;
  });

  afterEach(async () => {
    // Cleanup
    await prisma.user.deleteMany({
      where: { id: { in: [userId, otherUserId] } }
    });
  });

  describe('Subject CRUD', () => {
    it('creates a subject and assigns order correctly', async () => {
      const subject = await syllabusRepository.createSubject(userId, {
        examId,
        name: 'Math',
      });
      expect(subject.name).toBe('Math');
      expect(subject.order).toBe(0); // first subject
      subjectId = subject.id;
      
      const subject2 = await syllabusRepository.createSubject(userId, {
        examId,
        name: 'Science',
      });
      expect(subject2.order).toBe(1); // second subject
    });

    it('rejects subject creation if user does not own exam', async () => {
      await expect(
        syllabusRepository.createSubject(otherUserId, { examId, name: 'Math' })
      ).rejects.toThrow('Unauthorized');
    });

    it('updates a subject', async () => {
      const subject = await syllabusRepository.createSubject(userId, { examId, name: 'Math' });
      const updated = await syllabusRepository.updateSubject(userId, subject.id, { name: 'Mathematics' });
      expect(updated.name).toBe('Mathematics');
    });

    it('rejects update if user does not own subject', async () => {
      const subject = await syllabusRepository.createSubject(userId, { examId, name: 'Math' });
      await expect(
        syllabusRepository.updateSubject(otherUserId, subject.id, { name: 'Math2' })
      ).rejects.toThrow('Unauthorized');
    });

    it('deletes a subject', async () => {
      const subject = await syllabusRepository.createSubject(userId, { examId, name: 'Math' });
      await syllabusRepository.deleteSubject(userId, subject.id);
      const found = await prisma.subject.findUnique({ where: { id: subject.id } });
      expect(found).toBeNull();
    });
  });

  describe('Topic CRUD', () => {
    beforeEach(async () => {
      const subject = await syllabusRepository.createSubject(userId, { examId, name: 'Math' });
      subjectId = subject.id;
    });

    it('creates a topic', async () => {
      const topic = await syllabusRepository.createTopic(userId, {
        subjectId,
        name: 'Algebra',
        difficulty: Difficulty.MEDIUM,
        status: TopicStatus.NOT_STARTED,
      });
      expect(topic.name).toBe('Algebra');
      expect(topic.order).toBe(0);
      topicId = topic.id;
    });

    it('rejects topic creation if user does not own subject', async () => {
      await expect(
        syllabusRepository.createTopic(otherUserId, { subjectId, name: 'Algebra' })
      ).rejects.toThrow('Unauthorized');
    });

    it('reorders topics', async () => {
      const t1 = await syllabusRepository.createTopic(userId, { subjectId, name: 'A' });
      const t2 = await syllabusRepository.createTopic(userId, { subjectId, name: 'B' });
      const t3 = await syllabusRepository.createTopic(userId, { subjectId, name: 'C' });

      await syllabusRepository.reorderTopics(userId, subjectId, [
        { id: t1.id, newOrder: 2 },
        { id: t2.id, newOrder: 0 },
        { id: t3.id, newOrder: 1 },
      ]);

      const subjects = await syllabusRepository.getSubjectsByExamId(examId, userId);
      const math = subjects[0];
      
      expect(math.topics[0].id).toBe(t2.id); // order 0
      expect(math.topics[1].id).toBe(t3.id); // order 1
      expect(math.topics[2].id).toBe(t1.id); // order 2
    });
  });
});
