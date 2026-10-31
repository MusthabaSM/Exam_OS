'use server';

import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { progressRepository } from '@/lib/repositories/progressRepository';
import { ActionResponse } from '@/lib/validation/common';

export async function getDashboardDataAction(): Promise<ActionResponse<any>> {
  try {
    const userId = await getCurrentUserId();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const userName = user?.name || 'Student';
    
    // 1. Upcoming Exams (for the carousel, limit 4)
    const upcomingExamsData = await prisma.exam.findMany({
      where: { userId, status: 'UPCOMING' },
      orderBy: { examDate: 'asc' },
      take: 10,
    });

    const upcomingExams = await Promise.all(upcomingExamsData.map(async (exam) => {
      const metrics = await progressRepository.getProgressMetrics(exam.id, userId);
      return {
        ...exam,
        progress: metrics.readiness,
      };
    }));

    // 2. Global Progress Metrics (across ALL non-archived exams)
    let globalMetrics = {
      readiness: 0,
      accuracy: 0,
      studyHours: 0,
      questionsSolved: 0,
      streak: 0,
      weakAreas: [] as { id: string, topic: string, subject: string, accuracy: number }[],
      recentActivity: Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return { date: d.toISOString(), dayName: d.toLocaleDateString('en-US', { weekday: 'short' }), count: 0 };
      })
    };

    const allActiveExams = await prisma.exam.findMany({
      where: { 
        userId, 
        status: { in: ['UPCOMING', 'ONGOING'] } 
      },
    });

    if (allActiveExams.length > 0) {
      let totalReadiness = 0;
      let totalAccuracy = 0;
      let examsWithAccuracy = 0;

      await Promise.all(allActiveExams.map(async (exam) => {
        const metrics = await progressRepository.getProgressMetrics(exam.id, userId);
        totalReadiness += metrics.readiness;
        globalMetrics.studyHours += metrics.studyHours;
        globalMetrics.questionsSolved += metrics.questionsSolved;
        
        const acc = parseFloat(metrics.accuracy as any);
        if (metrics.questionsSolved > 0) {
          totalAccuracy += acc;
          examsWithAccuracy++;
        }
        
        // Aggregate recent activity
        if (metrics.recentActivity && metrics.recentActivity.length === 7) {
          metrics.recentActivity.forEach((day: any, i: number) => {
            globalMetrics.recentActivity[i].count += day.count;
          });
        }
      }));

      globalMetrics.readiness = Math.round(totalReadiness / allActiveExams.length);
      globalMetrics.accuracy = examsWithAccuracy > 0 ? parseFloat((totalAccuracy / examsWithAccuracy).toFixed(1)) : 0;
      
      // Calculate weak areas from subjectPerformance or topic performance
      // Wait, progressRepository gives subjectPerformance, but we need topic performance for Weak Areas.
      // Let's quickly query topic performance.
      const answers = await prisma.practiceAnswer.findMany({
        where: { 
          attempt: { userId, completedAt: { not: null } },
          selectedAnswer: { not: null }
        },
        include: {
          question: {
            select: { topicId: true, topic: { select: { name: true } }, subject: { select: { name: true } } }
          }
        }
      });
      
      const topicStats: Record<string, { topic: string, subject: string, total: number, correct: number }> = {};
      answers.forEach((ans: any) => {
        if (ans.question.topicId && ans.question.topic) {
          const tid = ans.question.topicId;
          if (!topicStats[tid]) {
            topicStats[tid] = { 
              topic: ans.question.topic.name, 
              subject: ans.question.subject?.name || 'Unknown', 
              total: 0, 
              correct: 0 
            };
          }
          topicStats[tid].total++;
          if (ans.isCorrect) topicStats[tid].correct++;
        }
      });
      
      const weakAreas = Object.values(topicStats).map((stat, i) => ({
        id: `weak-${i}`,
        topic: stat.topic,
        subject: stat.subject,
        accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
      })).filter(wa => wa.accuracy < 70).sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
      
      globalMetrics.weakAreas = weakAreas;
    }

    // 3. Today's Focus Tasks
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const todaysTasks = await prisma.studyTask.findMany({
      where: {
        userId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        OR: [
          { scheduledDate: { gte: startOfToday, lte: endOfToday } },
          { scheduledDate: null, createdAt: { gte: startOfToday, lte: endOfToday } }
        ]
      },
      include: {
        subject: { select: { name: true } },
        topic: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 4
    });

    const recentMaterials = await prisma.document.findMany({
      where: { exam: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        examId: true,
        name: true,
        documentType: true,
        createdAt: true,
      },
    });

    return { 
      success: true, 
      data: {
        userName,
        upcomingExams,
        globalMetrics,
        recentMaterials,
        todaysTasks: todaysTasks.map((t: any) => ({
          id: t.id,
          examId: t.examId,
          subject: t.subject?.name || 'General',
          topic: t.topic?.name || t.title,
          duration: t.estimatedMinutes ? `${t.estimatedMinutes} min` : '-',
          status: t.status
        }))
      } 
    };
  } catch (error: unknown) {
    console.error('Error in getDashboardDataAction:', error);
    return { success: false, error: 'Failed to fetch dashboard data' };
  }
}

import { dashboardRepository } from '@/lib/repositories/dashboardRepository';

export async function getExamDashboardDataAction(examId: string): Promise<ActionResponse<any>> {
  try {
    const userId = await getCurrentUserId();
    
    // Verify exam ownership first
    const exam = await prisma.exam.findFirst({
      where: { id: examId, userId }
    });
    
    if (!exam) {
      return { success: false, error: 'Exam not found or unauthorized' };
    }

    const data = await dashboardRepository.getDashboardData(examId, userId);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching exam dashboard data:', error);
    return { success: false, error: 'Failed to fetch exam dashboard data' };
  }
}
