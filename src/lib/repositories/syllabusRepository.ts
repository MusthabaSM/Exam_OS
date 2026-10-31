import prisma from '../db/prisma';
import { Subject, Topic, Prisma } from '@prisma/client';

export const syllabusRepository = {
  /**
   * Verify exam ownership to ensure security before allowing mutations.
   */
  async verifyExamOwnership(examId: string, userId: string): Promise<boolean> {
    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        userId: userId,
      },
      select: { id: true },
    });
    return !!exam;
  },

  /**
   * Verify subject ownership (via exam) to ensure security before allowing mutations on topics.
   */
  async verifySubjectOwnership(subjectId: string, userId: string): Promise<boolean> {
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        exam: {
          userId: userId,
        },
      },
      select: { id: true },
    });
    return !!subject;
  },

  /**
   * Verify topic ownership (via subject -> exam).
   */
  async verifyTopicOwnership(topicId: string, userId: string): Promise<boolean> {
    const topic = await prisma.topic.findFirst({
      where: {
        id: topicId,
        subject: {
          exam: {
            userId: userId,
          },
        },
      },
      select: { id: true },
    });
    return !!topic;
  },

  // ---------------------------------------------------------------------------
  // READ
  // ---------------------------------------------------------------------------

  async getSubjectsByExamId(examId: string, userId: string) {
    // Only return subjects if user owns the exam
    const isOwner = await this.verifyExamOwnership(examId, userId);
    if (!isOwner) {
      throw new Error('Unauthorized or exam not found');
    }

    return prisma.subject.findMany({
      where: { examId },
      include: {
        topics: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });
  },

  // ---------------------------------------------------------------------------
  // SUBJECT CRUD
  // ---------------------------------------------------------------------------

  async createSubject(userId: string, data: Omit<Prisma.SubjectCreateInput, 'exam'> & { examId: string }): Promise<Subject> {
    const isOwner = await this.verifyExamOwnership(data.examId, userId);
    if (!isOwner) {
      throw new Error('Unauthorized to create subject for this exam');
    }

    // Auto-calculate order if not provided
    let order = data.order ?? 0;
    if (order === 0) {
      const maxOrderSub = await prisma.subject.findFirst({
        where: { examId: data.examId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      if (maxOrderSub) {
        order = maxOrderSub.order + 1;
      }
    }

    return prisma.subject.create({
      data: {
        name: data.name,
        description: data.description,
        order,
        examId: data.examId,
      },
    });
  },

  async updateSubject(userId: string, id: string, data: Prisma.SubjectUpdateInput): Promise<Subject> {
    const isOwner = await this.verifySubjectOwnership(id, userId);
    if (!isOwner) {
      throw new Error('Unauthorized to update this subject');
    }

    return prisma.subject.update({
      where: { id },
      data,
    });
  },

  async deleteSubject(userId: string, id: string): Promise<Subject> {
    const isOwner = await this.verifySubjectOwnership(id, userId);
    if (!isOwner) {
      throw new Error('Unauthorized to delete this subject');
    }

    // Prisma schema specifies onDelete: Cascade from Subject to Topics
    return prisma.subject.delete({
      where: { id },
    });
  },

  // ---------------------------------------------------------------------------
  // TOPIC CRUD
  // ---------------------------------------------------------------------------

  async createTopic(userId: string, data: Omit<Prisma.TopicCreateInput, 'subject' | 'parentTopic'> & { subjectId: string; parentTopicId?: string | null }): Promise<Topic> {
    const isOwner = await this.verifySubjectOwnership(data.subjectId, userId);
    if (!isOwner) {
      throw new Error('Unauthorized to create topic for this subject');
    }

    let order = data.order ?? 0;
    if (order === 0) {
      const maxOrderTopic = await prisma.topic.findFirst({
        where: { subjectId: data.subjectId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      if (maxOrderTopic) {
        order = maxOrderTopic.order + 1;
      }
    }

    return prisma.topic.create({
      data: {
        name: data.name,
        description: data.description,
        order,
        difficulty: data.difficulty,
        estimatedStudyMinutes: data.estimatedStudyMinutes,
        status: data.status,
        subjectId: data.subjectId,
        parentTopicId: data.parentTopicId,
      },
    });
  },

  async updateTopic(userId: string, id: string, data: Prisma.TopicUpdateInput): Promise<Topic> {
    const isOwner = await this.verifyTopicOwnership(id, userId);
    if (!isOwner) {
      throw new Error('Unauthorized to update this topic');
    }

    return prisma.topic.update({
      where: { id },
      data,
    });
  },

  async deleteTopic(userId: string, id: string): Promise<Topic> {
    const isOwner = await this.verifyTopicOwnership(id, userId);
    if (!isOwner) {
      throw new Error('Unauthorized to delete this topic');
    }

    return prisma.topic.delete({
      where: { id },
    });
  },

  async reorderTopics(userId: string, subjectId: string, updates: { id: string; newOrder: number }[]): Promise<void> {
    const isOwner = await this.verifySubjectOwnership(subjectId, userId);
    if (!isOwner) {
      throw new Error('Unauthorized to reorder topics in this subject');
    }

    // Use a transaction to update all orders safely
    await prisma.$transaction(
      updates.map((update) =>
        prisma.topic.update({
          where: { id: update.id },
          data: { order: update.newOrder },
        })
      )
    );
  },

  async bulkCreateSyllabus(userId: string, examId: string, parsedData: { name: string; topics: string[] }[]): Promise<void> {
    const isOwner = await this.verifyExamOwnership(examId, userId);
    if (!isOwner) {
      throw new Error('Unauthorized to modify syllabus for this exam');
    }

    // Find the max order for subjects to append
    const maxOrderSub = await prisma.subject.findFirst({
      where: { examId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    let subjectOrder = maxOrderSub ? maxOrderSub.order + 1 : 1;

    // We can't do a single nested createMany with topics in SQLite if it doesn't support nested createMany. 
    // Wait, Prisma supports nested create in `create`, but for multiple subjects it would have to be an array of `create`. 
    // We can just use a loop inside a transaction.
    
    await prisma.$transaction(async (tx) => {
      for (const subjectData of parsedData) {
        const createdSubject = await tx.subject.create({
          data: {
            name: subjectData.name.substring(0, 255), // safety limit
            order: subjectOrder++,
            examId: examId,
          }
        });

        if (subjectData.topics.length > 0) {
          const topicData = subjectData.topics.map((topicName, index) => ({
            name: topicName.substring(0, 255),
            order: index + 1,
            subjectId: createdSubject.id,
          }));
          
          await tx.topic.createMany({
            data: topicData,
          });
        }
      }
    });
  },

  async deleteAllSubjects(userId: string, examId: string): Promise<void> {
    const isOwner = await this.verifyExamOwnership(examId, userId);
    if (!isOwner) {
      throw new Error('Unauthorized to modify syllabus for this exam');
    }

    await prisma.subject.deleteMany({
      where: { examId },
    });
  },
};
