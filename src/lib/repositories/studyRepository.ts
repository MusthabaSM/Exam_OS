import prisma from '../db/prisma';
import { StudyTask, StudySession, SessionStatus, TaskStatus } from '@prisma/client';
import { CreateStudyTaskInput, UpdateStudyTaskInput } from '../validation/studySchemas';

export const studyRepository = {
  getGlobalStudyTasks: async (userId: string, dateString?: string): Promise<StudyTask[]> => {
    const targetDate = dateString ? new Date(dateString) : new Date();
    
    // Ensure invalid dates fallback to today
    const validDate = isNaN(targetDate.getTime()) ? new Date() : targetDate;
    
    const startOfToday = new Date(validDate);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(validDate);
    endOfToday.setHours(23, 59, 59, 999);

    return prisma.studyTask.findMany({
      where: { 
        userId,
        OR: [
          { scheduledDate: { gte: startOfToday, lte: endOfToday } },
          { scheduledDate: null, createdAt: { gte: startOfToday, lte: endOfToday } }
        ]
      },
      include: {
        exam: { select: { name: true } },
        subject: { select: { name: true } },
        topic: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  getGlobalActiveSession: async (userId: string): Promise<StudySession | null> => {
    return prisma.studySession.findFirst({
      where: { userId, status: SessionStatus.ACTIVE },
    });
  },

  getStudyTasksByExamId: async (examId: string, userId: string): Promise<StudyTask[]> => {
    // Verify ownership
    const exam = await prisma.exam.findFirst({
      where: { id: examId, userId },
    });
    if (!exam) throw new Error('Unauthorized');

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return prisma.studyTask.findMany({
      where: { 
        userId,
        OR: [
          { examId },
          { topic: { subject: { examId } } },
          { subject: { examId } }
        ],
        AND: [
          {
            OR: [
              { scheduledDate: { gte: startOfToday, lte: endOfToday } },
              { scheduledDate: null, createdAt: { gte: startOfToday, lte: endOfToday } }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  getActiveSession: async (examId: string, userId: string): Promise<StudySession | null> => {
    return prisma.studySession.findFirst({
      where: { examId, userId, status: SessionStatus.ACTIVE },
    });
  },

  createStudyTask: async (userId: string, data: CreateStudyTaskInput): Promise<StudyTask> => {
    if (data.examId) {
      const exam = await prisma.exam.findFirst({
        where: { id: data.examId, userId },
      });
      if (!exam) throw new Error('Unauthorized');
    }

    return prisma.studyTask.create({
      data: {
        userId,
        examId: data.examId,
        subjectId: data.subjectId,
        topicId: data.topicId,
        title: data.title,
        description: data.description,
        scheduledDate: data.scheduledDate || new Date(),
        estimatedMinutes: data.estimatedMinutes,
        priority: data.priority,
        status: data.status,
      },
    });
  },

  updateStudyTask: async (userId: string, data: UpdateStudyTaskInput): Promise<StudyTask> => {
    const task = await prisma.studyTask.findUnique({
      where: { id: data.id },
    });

    if (!task || task.userId !== userId) throw new Error('Task not found or unauthorized');

    return prisma.studyTask.update({
      where: { id: data.id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        description: data.description !== undefined ? data.description : undefined,
        scheduledDate: data.scheduledDate !== undefined ? data.scheduledDate : undefined,
        estimatedMinutes: data.estimatedMinutes !== undefined ? data.estimatedMinutes : undefined,
        priority: data.priority !== undefined ? data.priority : undefined,
        status: data.status !== undefined ? data.status : undefined,
      },
    });
  },

  deleteStudyTask: async (userId: string, taskId: string): Promise<StudyTask> => {
    const task = await prisma.studyTask.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== userId) throw new Error('Task not found or unauthorized');

    return prisma.studyTask.delete({
      where: { id: taskId },
    });
  },

  // ---------------------------------------------------------------------------
  // SESSION MANAGEMENT (Server Authoritative)
  // ---------------------------------------------------------------------------

  startStudySession: async (userId: string, examId: string | null | undefined, studyTaskId?: string): Promise<StudySession> => {
    // Ensure user owns exam if provided
    if (examId) {
      const exam = await prisma.exam.findFirst({
        where: { id: examId, userId },
      });
      if (!exam) throw new Error('Unauthorized');
    }

    if (studyTaskId) {
      const task = await prisma.studyTask.findUnique({ where: { id: studyTaskId } });
      if (!task || task.userId !== userId) throw new Error('Task not found or unauthorized');

      // Prevent multiple active sessions for the same task
      const activeSessions = await prisma.studySession.findMany({
        where: { studyTaskId, userId, status: SessionStatus.ACTIVE },
      });
      if (activeSessions.length > 0) {
        throw new Error('An active session already exists for this task');
      }
    }

    return prisma.studySession.create({
      data: {
        userId,
        examId: examId || undefined,
        studyTaskId: studyTaskId || null,
        startedAt: new Date(),
        status: SessionStatus.ACTIVE,
      },
    });
  },

  pauseStudySession: async (userId: string, sessionId: string): Promise<StudySession> => {
    const session = await prisma.studySession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) throw new Error('Session not found or unauthorized');
    if (session.status !== SessionStatus.ACTIVE) throw new Error('Session is not active');

    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);

    return prisma.$transaction(async (tx) => {
      const updatedSession = await tx.studySession.update({
        where: { id: sessionId },
        data: {
          endedAt,
          durationSeconds,
          status: SessionStatus.PAUSED,
        },
      });

      if (session.studyTaskId) {
        const durationMinutes = Math.round(durationSeconds / 60);
        if (durationMinutes > 0) {
          await tx.studyTask.update({
            where: { id: session.studyTaskId },
            data: {
              actualMinutes: { increment: durationMinutes },
              status: TaskStatus.IN_PROGRESS,
            },
          });
        }
      }

      return updatedSession;
    });
  },

  resumeStudySession: async (userId: string, sessionId: string): Promise<StudySession> => {
    // To resume, we find the paused session, get its examId/studyTaskId, and start a new active chunk
    const session = await prisma.studySession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) throw new Error('Session not found or unauthorized');
    
    // Create new session chunk for the same task/exam
    return studyRepository.startStudySession(userId, session.examId, session.studyTaskId || undefined);
  },

  completeStudySession: async (userId: string, sessionId: string): Promise<StudySession> => {
    const session = await prisma.studySession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) throw new Error('Session not found or unauthorized');

    return prisma.$transaction(async (tx) => {
      let updatedSession = session;
      let finalDurationSeconds = session.durationSeconds;
      let additionalMinutes = 0;

      // If active, close it and add time
      if (session.status === SessionStatus.ACTIVE) {
        const endedAt = new Date();
        const durationSeconds = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);
        finalDurationSeconds = durationSeconds;
        additionalMinutes = Math.round(durationSeconds / 60);

        updatedSession = await tx.studySession.update({
          where: { id: sessionId },
          data: {
            endedAt,
            durationSeconds,
            status: SessionStatus.COMPLETED,
          },
        });
      } else {
        // If already paused, just mark as completed
        updatedSession = await tx.studySession.update({
          where: { id: sessionId },
          data: { status: SessionStatus.COMPLETED },
        });
      }

      if (session.studyTaskId) {
        const updateData: import('@prisma/client').Prisma.StudyTaskUpdateInput = {
          status: TaskStatus.COMPLETED,
        };
        if (additionalMinutes > 0) {
          updateData.actualMinutes = { increment: additionalMinutes };
        }

        await tx.studyTask.update({
          where: { id: session.studyTaskId },
          data: updateData,
        });
      }

      return updatedSession;
    });
  }
};
