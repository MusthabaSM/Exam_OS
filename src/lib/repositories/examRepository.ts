import prisma from '@/lib/db/prisma';
import { Exam, ExamStatus } from '@prisma/client';

export type CreateExamData = {
  name: string;
  organization?: string | null;
  description?: string | null;
  notificationDate?: Date | null;
  applicationStartDate?: Date | null;
  applicationEndDate?: Date | null;
  prelimsDate?: Date | null;
  mainsDate?: Date | null;
  examDate?: Date | null;
  officialWebsite?: string | null;
  status?: ExamStatus;
  minimumQualifyingMarks?: string | null;
  weightageDistribution?: any | null;
  isDevelopment?: boolean;
  stages?: { id?: string; name: string; description?: string | null; order?: number }[];
};

export type UpdateExamData = Partial<CreateExamData>;

export const examRepository = {
  /**
   * Get all exams for a user, excluding archived ones by default
   */
  async getExamsByUserId(userId: string, includeArchived = false): Promise<Exam[]> {
    return prisma.exam.findMany({
      where: {
        userId,
        ...(includeArchived ? {} : { status: { not: ExamStatus.ARCHIVED } }),
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get a specific exam by ID, ensuring it belongs to the user
   */
  async getExamById(id: string, userId: string): Promise<Exam | null> {
    return prisma.exam.findUnique({
      where: {
        id,
        userId,
      },
      // When fetching an exam workspace, retrieve only the relationships required
      include: {
        examStages: {
          orderBy: { order: 'asc' },
        },
        subjects: {
          orderBy: { order: 'asc' },
          include: {
            topics: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  },

  /**
   * Create a new exam
   */
  async createExam(userId: string, data: CreateExamData): Promise<Exam> {
    const { stages, ...examData } = data;
    
    return prisma.exam.create({
      data: {
        ...examData,
        userId,
        examStages: stages && stages.length > 0 ? {
          create: stages.map((s, idx) => ({
            name: s.name,
            description: s.description,
            order: s.order ?? idx,
          }))
        } : undefined
      },
    });
  },

  /**
   * Update an existing exam
   */
  async updateExam(id: string, userId: string, data: UpdateExamData): Promise<Exam> {
    const existing = await prisma.exam.findUnique({ where: { id, userId } });
    if (!existing) {
      throw new Error("Exam not found or you don't have permission to update it.");
    }

    const { stages, ...examData } = data;

    return prisma.$transaction(async (tx) => {
      // 1. Update the core exam
      const updatedExam = await tx.exam.update({
        where: { id },
        data: examData,
      });

      // 2. Synchronize stages safely
      if (stages !== undefined) {
        const existingStages = await tx.examStage.findMany({ where: { examId: id } });
        const existingIds = existingStages.map(s => s.id);
        const payloadIds = stages.filter(s => s.id).map(s => s.id as string);
        
        // Delete removed stages
        const stagesToDelete = existingIds.filter(eid => !payloadIds.includes(eid));
        if (stagesToDelete.length > 0) {
          await tx.examStage.deleteMany({ where: { id: { in: stagesToDelete } } });
        }
        
        // Upsert stages (update if ID exists, create if not)
        for (const [idx, stage] of stages.entries()) {
          const order = stage.order ?? idx;
          if (stage.id && existingIds.includes(stage.id)) {
            await tx.examStage.update({
              where: { id: stage.id },
              data: { name: stage.name, description: stage.description, order }
            });
          } else {
            await tx.examStage.create({
              data: { examId: id, name: stage.name, description: stage.description, order }
            });
          }
        }
      }

      return updatedExam;
    });
  },

  /**
   * Archive an exam (soft delete)
   */
  async archiveExam(id: string, userId: string): Promise<Exam> {
    const existing = await prisma.exam.findUnique({ where: { id, userId } });
    
    if (!existing) {
      throw new Error("Exam not found or you don't have permission to archive it.");
    }

    return prisma.exam.update({
      where: { id },
      data: { status: ExamStatus.ARCHIVED },
    });
  },
  
  /**
   * Delete an exam permanently
   */
  async deleteExam(id: string, userId: string): Promise<Exam> {
    const existing = await prisma.exam.findUnique({ where: { id, userId } });
    
    if (!existing) {
      throw new Error("Exam not found or you don't have permission to delete it.");
    }

    return prisma.exam.delete({
      where: { id },
    });
  }
};
