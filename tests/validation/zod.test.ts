import { describe, it, expect } from 'vitest';
import {
  createExamSchema,
  createSubjectSchema,
  createTopicSchema,
  createStudyTaskSchema,
  createPracticeQuestionSchema,
  createNoteSchema,
  createCalendarEventSchema,
  sendMessageSchema,
  updateSettingsSchema,
} from '../../src/lib/validation';

// Helper to generate a valid CUID for testing
const cuid = 'c' + 'x'.repeat(24);

describe('Zod Validation Schemas', () => {

  describe('Exam Validation', () => {
    it('validates a correct exam', () => {
      const data = {
        name: 'Test Exam',
        notificationDate: new Date('2026-01-01'),
        officialWebsite: 'https://example.com',
        stages: [
          { name: 'Prelims', order: 0 },
          { name: 'Mains', order: 1 }
        ]
      };
      const result = createExamSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects an empty exam name', () => {
      const data = { name: '' };
      const result = createExamSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects an invalid URL', () => {
      const data = { name: 'Exam', officialWebsite: 'not-a-url' };
      const result = createExamSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects an invalid date range (end before start)', () => {
      const data = {
        name: 'Exam',
        applicationStartDate: new Date('2026-02-01'),
        applicationEndDate: new Date('2026-01-01'),
      };
      const result = createExamSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.applicationEndDate).toBeDefined();
      }
    });

    it('rejects an invalid stage (missing name)', () => {
      const data = {
        name: 'Test Exam',
        stages: [{ order: 0 }]
      };
      const result = createExamSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects an invalid stage (empty name)', () => {
      const data = {
        name: 'Test Exam',
        stages: [{ name: '  ', order: 0 }]
      };
      const result = createExamSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Subject Validation', () => {
    it('validates a correct subject', () => {
      const data = { examId: cuid, name: 'Math' };
      const result = createSubjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects an empty subject name', () => {
      const data = { examId: cuid, name: '' };
      const result = createSubjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Topic Validation', () => {
    it('validates a correct topic', () => {
      const data = { subjectId: cuid, name: 'Algebra' };
      const result = createTopicSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects an invalid status', () => {
      const data = { subjectId: cuid, name: 'Algebra', status: 'INVALID_STATUS' };
      const result = createTopicSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('StudyTask Validation', () => {
    it('validates a correct study task', () => {
      const data = { examId: cuid, title: 'Read Chapter 1' };
      const result = createStudyTaskSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects negative duration', () => {
      const data = { examId: cuid, title: 'Task', estimatedMinutes: -10 };
      const result = createStudyTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects an empty title', () => {
      const data = { examId: cuid, title: '' };
      const result = createStudyTaskSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Practice Validation', () => {
    it('validates a correct practice question', () => {
      const data = {
        examId: cuid,
        question: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: '4',
      };
      const result = createPracticeQuestionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects if correct answer is not in options', () => {
      const data = {
        examId: cuid,
        question: 'What is 2+2?',
        options: ['3', '5', '6'],
        correctAnswer: '4', // '4' is not in options
      };
      const result = createPracticeQuestionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Note Validation', () => {
    it('validates a correct note', () => {
      const data = { title: 'My Note', content: '<p>Hello</p>' };
      const result = createNoteSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing title', () => {
      const data = { title: '', content: 'hello' };
      const result = createNoteSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Calendar Validation', () => {
    it('validates a correct calendar event', () => {
      const data = {
        title: 'Exam Day',
        startAt: new Date('2026-09-15T09:00:00Z'),
        endAt: new Date('2026-09-15T12:00:00Z'),
      };
      const result = createCalendarEventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects end before start', () => {
      const data = {
        title: 'Exam Day',
        startAt: new Date('2026-09-15T12:00:00Z'),
        endAt: new Date('2026-09-15T09:00:00Z'), // Ends before it starts
      };
      const result = createCalendarEventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('AI Validation', () => {
    it('validates a correct AI message', () => {
      const data = { conversationId: cuid, content: 'Explain quantum physics.' };
      const result = sendMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects empty message', () => {
      const data = { conversationId: cuid, content: '   ' };
      const result = sendMessageSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('rejects excessive message length', () => {
      const data = { conversationId: cuid, content: 'a'.repeat(4001) };
      const result = sendMessageSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Settings Validation', () => {
    it('validates a correct setting enum', () => {
      const data = { appearance: 'dark' };
      const result = updateSettingsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects an invalid enum', () => {
      const data = { appearance: 'neon-green' };
      const result = updateSettingsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
