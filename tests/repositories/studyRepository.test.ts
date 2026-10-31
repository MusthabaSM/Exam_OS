import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import prisma from '../../src/lib/db/prisma';
import { studyRepository } from '../../src/lib/repositories/studyRepository';
import { SessionStatus, TaskStatus } from '@prisma/client';

describe('Study Repository', () => {
  let userId: string;
  let otherUserId: string;
  let examId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { email: `test-study-${Date.now()}@example.com`, name: 'Test User' },
    });
    userId = user.id;

    const otherUser = await prisma.user.create({
      data: { email: `test-study-other-${Date.now()}@example.com`, name: 'Other User' },
    });
    otherUserId = otherUser.id;

    const exam = await prisma.exam.create({
      data: {
        userId,
        name: 'Test Exam Study',
        isDevelopment: true,
      },
    });
    examId = exam.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [userId, otherUserId] } }
    });
  });

  describe('Study Task CRUD', () => {
    it('creates a study task', async () => {
      const task = await studyRepository.createStudyTask(userId, {
        examId,
        title: 'Learn Math',
        estimatedMinutes: 60,
        priority: 'MEDIUM',
        status: 'TODO',
      });
      expect(task.title).toBe('Learn Math');
      expect(task.estimatedMinutes).toBe(60);
      expect(task.status).toBe(TaskStatus.TODO);
    });

    it('rejects task creation if user does not own exam', async () => {
      await expect(
        studyRepository.createStudyTask(otherUserId, {
          examId,
          title: 'Learn Math',
          priority: 'MEDIUM',
          status: 'TODO',
        })
      ).rejects.toThrow('Unauthorized');
    });

    it('updates a task', async () => {
      const task = await studyRepository.createStudyTask(userId, { examId, title: 'Learn Math', priority: 'MEDIUM', status: 'TODO' });
      const updated = await studyRepository.updateStudyTask(userId, {
        id: task.id,
        title: 'Learn Advanced Math',
      });
      expect(updated.title).toBe('Learn Advanced Math');
    });
  });

  describe('Session Management', () => {
    it('starts a session and prevents multiple active sessions for the same task', async () => {
      const task = await studyRepository.createStudyTask(userId, { examId, title: 'Learn Math', priority: 'MEDIUM', status: 'TODO' });
      
      const session = await studyRepository.startStudySession(userId, examId, task.id);
      expect(session.status).toBe(SessionStatus.ACTIVE);
      expect(session.studyTaskId).toBe(task.id);

      await expect(
        studyRepository.startStudySession(userId, examId, task.id)
      ).rejects.toThrow('An active session already exists for this task');
    });

    it('pauses a session and updates task actual minutes', async () => {
      const task = await studyRepository.createStudyTask(userId, { examId, title: 'Learn Math', priority: 'MEDIUM', status: 'TODO' });
      const session = await studyRepository.startStudySession(userId, examId, task.id);
      
      // We manually update the startedAt to simulate time passing (60 minutes)
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      await prisma.studySession.update({
        where: { id: session.id },
        data: { startedAt: pastDate },
      });

      const pausedSession = await studyRepository.pauseStudySession(userId, session.id);
      expect(pausedSession.status).toBe(SessionStatus.PAUSED);
      expect(pausedSession.durationSeconds).toBeGreaterThanOrEqual(3599); // roughly 60 mins

      const updatedTask = await prisma.studyTask.findUnique({ where: { id: task.id } });
      expect(updatedTask?.actualMinutes).toBeGreaterThanOrEqual(60);
      expect(updatedTask?.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('resumes a session by creating a new active session', async () => {
      const task = await studyRepository.createStudyTask(userId, { examId, title: 'Learn Math', priority: 'MEDIUM', status: 'TODO' });
      const session = await studyRepository.startStudySession(userId, examId, task.id);
      await studyRepository.pauseStudySession(userId, session.id);

      const newSession = await studyRepository.resumeStudySession(userId, session.id);
      expect(newSession.id).not.toBe(session.id);
      expect(newSession.status).toBe(SessionStatus.ACTIVE);
      expect(newSession.studyTaskId).toBe(task.id);
    });

    it('completes a session and marks task as completed', async () => {
      const task = await studyRepository.createStudyTask(userId, { examId, title: 'Learn Math', priority: 'MEDIUM', status: 'TODO' });
      const session = await studyRepository.startStudySession(userId, examId, task.id);
      
      const completedSession = await studyRepository.completeStudySession(userId, session.id);
      expect(completedSession.status).toBe(SessionStatus.COMPLETED);

      const updatedTask = await prisma.studyTask.findUnique({ where: { id: task.id } });
      expect(updatedTask?.status).toBe(TaskStatus.COMPLETED);
    });
  });
});
