import prisma from '../db/prisma';

export const dashboardRepository = {
  getDashboardData: async (examId: string, userId: string) => {
    // Calculate task completion for readiness
    const tasks = await prisma.studyTask.findMany({
      where: { 
        userId,
        OR: [
          { examId },
          { topic: { subject: { examId } } },
          { subject: { examId } }
        ]
      },
      select: { status: true },
    });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: { status: string }) => t.status === 'COMPLETED').length;
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate accuracy and questions from PracticeAttempt
    const attempts = await prisma.practiceAttempt.findMany({
      where: { userId, examId, completedAt: { not: null } },
      select: { correctAnswers: true, wrongAnswers: true },
    });
    let questionsAttempted = 0;
    let questionsCorrect = 0;
    attempts.forEach((a: { correctAnswers: number, wrongAnswers: number }) => {
      questionsAttempted += a.correctAnswers + a.wrongAnswers;
      questionsCorrect += a.correctAnswers;
    });
    const accuracy = questionsAttempted > 0 ? (questionsCorrect / questionsAttempted) * 100 : 0;

    // Calculate Topic Progress
    const topics = await prisma.topic.findMany({
      where: { subject: { examId } },
      select: { status: true },
    });
    const totalTopics = topics.length;
    const completedTopics = topics.filter((t: { status: string }) => t.status === 'COMPLETED').length;
    const topicProgress = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    // Readiness is average of accuracy, task progress, and topic progress
    let readiness = 0;
    const readinessFactors = [];
    if (totalTasks > 0) readinessFactors.push(taskProgress);
    if (totalTopics > 0) readinessFactors.push(topicProgress);
    if (questionsAttempted > 0) readinessFactors.push(accuracy);
    
    if (readinessFactors.length > 0) {
      readiness = readinessFactors.reduce((a, b) => a + b, 0) / readinessFactors.length;
    }

    // Calculate Study Time
    const sessions = await prisma.studySession.findMany({
      where: { userId, examId },
      select: { durationSeconds: true },
    });
    const totalStudySeconds = sessions.reduce((sum: number, s: { durationSeconds: number }) => sum + s.durationSeconds, 0);
    const studyHours = parseFloat((totalStudySeconds / 3600).toFixed(1));

    // Placeholder streak
    const streak = 0; 

    // 2. Today's Focus
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaysTasks = await prisma.studyTask.findMany({
      where: {
        userId,
        OR: [
          { examId },
          { topic: { subject: { examId } } },
          { subject: { examId } }
        ],
        status: { in: ['TODO', 'IN_PROGRESS'] },
        AND: [
          {
            OR: [
              { scheduledDate: { gte: startOfToday, lte: endOfToday } },
              { scheduledDate: null, createdAt: { gte: startOfToday, lte: endOfToday } }
            ]
          }
        ]
      },
      include: {
        subject: { select: { name: true } },
        topic: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // 3. Recent Materials
    const recentMaterials = await prisma.document.findMany({
      where: { examId },
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

    // 4. Weak Areas
    const answers = await prisma.practiceAnswer.findMany({
      where: {
        attempt: { userId, examId, completedAt: { not: null } },
        selectedAnswer: { not: null },
      },
      include: {
        question: {
          select: {
            topicId: true,
            topic: { select: { name: true } },
            subject: { select: { name: true } },
          },
        },
      },
    });

    const topicStats: Record<string, { topicName: string, subjectName: string, total: number, correct: number }> = {};
    
    answers.forEach((ans: { question: { topicId: string | null, topic: { name: string } | null, subject: { name: string } | null }, isCorrect: boolean }) => {
      if (ans.question.topicId && ans.question.topic && ans.question.subject) {
        const tid = ans.question.topicId;
        if (!topicStats[tid]) {
          topicStats[tid] = {
            topicName: ans.question.topic.name,
            subjectName: ans.question.subject.name,
            total: 0,
            correct: 0,
          };
        }
        topicStats[tid].total += 1;
        if (ans.isCorrect) {
          topicStats[tid].correct += 1;
        }
      }
    });

    const weakAreas = Object.entries(topicStats)
      .map(([id, stat]) => ({
        id,
        topic: stat.topicName,
        subject: stat.subjectName,
        accuracy: Math.round((stat.correct / stat.total) * 100),
        totalQuestions: stat.total,
      }))
      .filter((w: { totalQuestions: number, accuracy: number }) => w.totalQuestions >= 3 && w.accuracy < 60)
      .sort((a: { accuracy: number }, b: { accuracy: number }) => a.accuracy - b.accuracy)
      .slice(0, 5);

    return {
      metrics: {
        readiness: Math.round(readiness),
        accuracy: Math.round(accuracy),
        questionsSolved: questionsAttempted,
        streak,
        studyHours,
      },
      todaysTasks,
      recentMaterials,
      weakAreas,
    };
  }
};
