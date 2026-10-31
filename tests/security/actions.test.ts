import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPracticeQuestionsAction, createPracticeQuestionAction } from '@/actions/practiceActions';
import { examRepository } from '@/lib/repositories/examRepository';
import { practiceRepository } from '@/lib/repositories/practiceRepository';
import { getCurrentUserId } from '@/lib/auth';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getCurrentUserId: vi.fn(),
}));
vi.mock('@/lib/repositories/examRepository', () => ({
  examRepository: {
    getExamById: vi.fn(),
  }
}));
vi.mock('@/lib/repositories/practiceRepository', () => ({
  practiceRepository: {
    getQuestionsForAttempt: vi.fn(),
    createPracticeQuestion: vi.fn(),
  }
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('practiceActions Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPracticeQuestionAction', () => {
    it('succeeds when user owns the exam', async () => {
      vi.mocked(getCurrentUserId).mockResolvedValue('user1');
      vi.mocked(examRepository.getExamById).mockResolvedValue({ id: 'exam1' } as any);
      vi.mocked(practiceRepository.createPracticeQuestion).mockResolvedValue({ id: 'q1' } as any);

      const res = await createPracticeQuestionAction({
        examId: 'exam1',
        question: 'Q',
        options: ['A', 'B'],
        correctAnswer: 'A',
      });

      expect(res.success).toBe(true);
      expect(examRepository.getExamById).toHaveBeenCalledWith('exam1', 'user1');
      expect(practiceRepository.createPracticeQuestion).toHaveBeenCalled();
    });

    it('rejected when user does not own the exam (IDOR attempt)', async () => {
      vi.mocked(getCurrentUserId).mockResolvedValue('user1');
      vi.mocked(examRepository.getExamById).mockResolvedValue(null);

      const res = await createPracticeQuestionAction({
        examId: 'other-user-exam',
        question: 'Q',
        options: ['A', 'B'],
        correctAnswer: 'A',
      });

      expect(res.success).toBe(false);
      expect((res as any).error).toContain('Unauthorized');
      expect(practiceRepository.createPracticeQuestion).not.toHaveBeenCalled();
    });
  });

  describe('getPracticeQuestionsAction', () => {
    it('succeeds with user own exam', async () => {
      vi.mocked(getCurrentUserId).mockResolvedValue('user1');
      vi.mocked(examRepository.getExamById).mockResolvedValue({ id: 'exam1' } as any);
      vi.mocked(practiceRepository.getQuestionsForAttempt).mockResolvedValue([{
        id: 'q1', examId: 'exam1', question: 'test', options: [], correctAnswer: 'A', explanation: 'exp'
      }] as any);

      const res = await getPracticeQuestionsAction('exam1');
      expect(res.success).toBe(true);
      if (res.success) {
        // Assert correct answer/explanation are stripped
        expect((res.data[0] as any).correctAnswer).toBeUndefined();
        expect((res.data[0] as any).explanation).toBeUndefined();
      }
    });

    it('rejected with another user exam', async () => {
      vi.mocked(getCurrentUserId).mockResolvedValue('user1');
      vi.mocked(examRepository.getExamById).mockResolvedValue(null);

      const res = await getPracticeQuestionsAction('other-user-exam');
      expect(res.success).toBe(false);
      expect((res as any).error).toContain('Unauthorized');
      expect(practiceRepository.getQuestionsForAttempt).not.toHaveBeenCalled();
    });
  });
});
