import prisma from '../db/prisma';
import { Note } from '@prisma/client';
import { CreateNoteInput, UpdateNoteInput } from '../validation/noteSchemas';

export const noteRepository = {
  getNotes: async (userId: string): Promise<Note[]> => {
    return prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        exam: true,
      }
    });
  },

  getNotesByExamId: async (examId: string, userId: string): Promise<Note[]> => {
    return prisma.note.findMany({
      where: { userId, examId },
      orderBy: { updatedAt: 'desc' },
      include: {
        exam: true,
      }
    });
  },

  getNoteById: async (noteId: string, userId: string): Promise<Note | null> => {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) return null;
    if (note.userId !== userId) throw new Error('Unauthorized');

    return note;
  },

  createNote: async (userId: string, data: CreateNoteInput): Promise<Note> => {
    // Note: A note might not belong to a specific exam or subject.
    // However, if they are provided, we should verify ownership of the exam.
    if (data.examId) {
      const exam = await prisma.exam.findFirst({
        where: { id: data.examId, userId },
      });
      if (!exam) throw new Error('Unauthorized for this exam');
    }

    return prisma.note.create({
      data: {
        userId,
        examId: data.examId,
        subjectId: data.subjectId,
        title: data.title,
        content: data.content,
      },
    });
  },

  updateNote: async (userId: string, data: UpdateNoteInput): Promise<Note> => {
    const note = await prisma.note.findUnique({
      where: { id: data.id },
    });

    if (!note) throw new Error('Note not found');
    if (note.userId !== userId) throw new Error('Unauthorized');

    if (data.examId) {
      const exam = await prisma.exam.findFirst({
        where: { id: data.examId, userId },
      });
      if (!exam) throw new Error('Unauthorized for this exam');
    }

    return prisma.note.update({
      where: { id: data.id },
      data: {
        examId: data.examId !== undefined ? data.examId : undefined,
        subjectId: data.subjectId !== undefined ? data.subjectId : undefined,
        title: data.title !== undefined ? data.title : undefined,
        content: data.content !== undefined ? data.content : undefined,
      },
    });
  },

  deleteNote: async (userId: string, noteId: string): Promise<Note> => {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) throw new Error('Note not found');
    if (note.userId !== userId) throw new Error('Unauthorized');

    return prisma.note.delete({
      where: { id: noteId },
    });
  },
};
