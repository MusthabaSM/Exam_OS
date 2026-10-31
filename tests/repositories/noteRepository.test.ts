import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import prisma from '../../src/lib/db/prisma';
import { noteRepository } from '../../src/lib/repositories/noteRepository';

describe('Note Repository', () => {
  let userId: string;
  let otherUserId: string;
  let examId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: { email: `test-note-${Date.now()}@example.com`, name: 'Test User' },
    });
    userId = user.id;

    const otherUser = await prisma.user.create({
      data: { email: `test-note-other-${Date.now()}@example.com`, name: 'Other User' },
    });
    otherUserId = otherUser.id;

    const exam = await prisma.exam.create({
      data: {
        userId,
        name: 'Test Exam Note',
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

  describe('Note CRUD', () => {
    it('creates a note', async () => {
      const note = await noteRepository.createNote(userId, {
        title: 'My Note',
        content: '<p>Hello world</p>',
      });
      expect(note.title).toBe('My Note');
      expect(note.content).toBe('<p>Hello world</p>');
      expect(note.userId).toBe(userId);
    });

    it('updates a note', async () => {
      const note = await noteRepository.createNote(userId, {
        title: 'My Note',
        content: '<p>Hello world</p>',
      });

      const updated = await noteRepository.updateNote(userId, {
        id: note.id,
        title: 'Updated Note',
      });

      expect(updated.title).toBe('Updated Note');
    });

    it('rejects update if user does not own note', async () => {
      const note = await noteRepository.createNote(userId, {
        title: 'My Note',
        content: '<p>Hello world</p>',
      });

      await expect(
        noteRepository.updateNote(otherUserId, { id: note.id, title: 'Updated' })
      ).rejects.toThrow('Unauthorized');
    });

    it('deletes a note', async () => {
      const note = await noteRepository.createNote(userId, {
        title: 'My Note',
        content: '<p>Hello world</p>',
      });

      await noteRepository.deleteNote(userId, note.id);
      
      const found = await noteRepository.getNoteById(note.id, userId);
      expect(found).toBeNull();
    });
  });
});
