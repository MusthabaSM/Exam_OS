import prisma from '../db/prisma';

export const progressRepository = {
  getProgressMetrics: async (examId: string, userId: string) => {
    // 1. Study time (sum of durationSeconds from completed/active sessions)
    const sessions = await prisma.studySession.findMany({
      where: { userId, examId },
      select: { durationSeconds: true }
    });
    const totalStudySeconds = sessions.reduce((sum: number, s: any) => sum + s.durationSeconds, 0);
    const studyHours = parseFloat((totalStudySeconds / 3600).toFixed(1));

    // 2. Questions Attempted & Correct & Accuracy
    const attempts = await prisma.practiceAttempt.findMany({
      where: { userId, examId, completedAt: { not: null } },
      select: { correctAnswers: true, wrongAnswers: true }
    });
    
    let totalQuestionsAttempted = 0;
    let totalQuestionsCorrect = 0;
    
    attempts.forEach((a: any) => {
      totalQuestionsAttempted += (a.correctAnswers + a.wrongAnswers);
      totalQuestionsCorrect += a.correctAnswers;
    });

    const accuracy = totalQuestionsAttempted > 0 
      ? (totalQuestionsCorrect / totalQuestionsAttempted) * 100 
      : 0;

    // 3. Task Progress (replaces Topic progress since Topic status isn't manually managed)
    const tasks = await prisma.studyTask.findMany({
      where: { 
        userId,
        OR: [
          { examId },
          { topic: { subject: { examId } } },
          { subject: { examId } }
        ]
      },
      select: { status: true }
    });
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED').length;
    const taskProgressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // 3b. Topic Progress
    const topics = await prisma.topic.findMany({
      where: { subject: { examId } },
      select: { status: true }
    });
    
    const totalTopics = topics.length;
    const completedTopics = topics.filter((t: any) => t.status === 'COMPLETED').length;
    const topicProgressPercent = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

    // Overall Readiness
    let readiness = 0;
    const readinessFactors = [];
    if (totalTasks > 0) readinessFactors.push(taskProgressPercent);
    if (totalTopics > 0) readinessFactors.push(topicProgressPercent);
    if (totalQuestionsAttempted > 0) readinessFactors.push(accuracy);
    
    if (readinessFactors.length > 0) {
      readiness = readinessFactors.reduce((a, b) => a + b, 0) / readinessFactors.length;
    }

    // 4. Subject Performance
    // To get subject performance, we need to know how many correct answers per subject.
    // Instead of a massive query, we can query PracticeAnswer grouped by subject via question.
    const answers = await prisma.practiceAnswer.findMany({
      where: { 
        attempt: { userId, examId, completedAt: { not: null } },
        selectedAnswer: { not: null }
      },
      include: {
        question: {
          select: { subjectId: true, subject: { select: { name: true } } }
        }
      }
    });

    const subjectStats: Record<string, { name: string, total: number, correct: number }> = {};
    
    answers.forEach((ans: any) => {
      if (ans.question.subjectId && ans.question.subject) {
        const sid = ans.question.subjectId;
        if (!subjectStats[sid]) {
          subjectStats[sid] = { name: ans.question.subject.name, total: 0, correct: 0 };
        }
        subjectStats[sid].total += 1;
        if (ans.isCorrect) {
          subjectStats[sid].correct += 1;
        }
      }
    });

    const subjectPerformance = Object.values(subjectStats).map(stat => ({
      subject: stat.name,
      score: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
    })).sort((a, b) => b.score - a.score);

    // 5. Recent Activity (last 7 days)
    // Find attempts per day
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const recentActivity = last7Days.map(date => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      // We count answers in that day
      const count = answers.filter((a: any) => {
        return a.createdAt >= date && a.createdAt < nextDay;
      }).length;

      return {
        date: date.toISOString(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count
      };
    });

    return {
      readiness: Math.round(readiness),
      accuracy: accuracy.toFixed(1),
      questionsSolved: totalQuestionsAttempted,
      studyHours,
      totalTasks,
      completedTasks,
      subjectPerformance,
      recentActivity,
    };
  }
};
