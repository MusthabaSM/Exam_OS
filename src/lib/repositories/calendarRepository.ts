import prisma from '../db/prisma';

export type UnifiedCalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: 'exam' | 'deadline' | 'study' | 'other';
  source: 'CalendarEvent' | 'ExamStage' | 'StudyTask';
  examId?: string;
};

export const calendarRepository = {
  getEvents: async (userId: string, startDate: Date, endDate: Date): Promise<UnifiedCalendarEvent[]> => {
    // 1. Fetch CalendarEvents
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        userId,
        startAt: { gte: startDate, lte: endDate }
      }
    });

    // 2. Fetch Exams for important dates
    const exams = await prisma.exam.findMany({
      where: { userId },
      select: { 
        id: true, name: true, examDate: true, 
        prelimsDate: true, mainsDate: true,
        applicationStartDate: true, applicationEndDate: true, notificationDate: true
      }
    });

    // 3. Fetch StudyTasks
    const studyTasks = await prisma.studyTask.findMany({
      where: {
        userId,
        scheduledDate: { gte: startDate, lte: endDate }
      },
      include: {
        subject: true,
        topic: true
      }
    });

    const unifiedEvents: UnifiedCalendarEvent[] = [];

    // Map CalendarEvents
    calendarEvents.forEach((e: any) => {
      let mappedType: 'exam' | 'deadline' | 'study' | 'other' = 'other';
      if (e.type === 'EXAM') mappedType = 'exam';
      if (e.type === 'DEADLINE') mappedType = 'deadline';
      if (e.type === 'STUDY') mappedType = 'study';
      
      unifiedEvents.push({
        id: `ce-${e.id}`,
        title: e.title,
        date: e.startAt.toISOString(),
        type: mappedType,
        source: 'CalendarEvent',
        examId: e.examId || undefined
      });
    });

    // Map ExamStages & Exam Dates
    exams.forEach((exam: any) => {
      // Main exam date
      if (exam.examDate && exam.examDate >= startDate && exam.examDate <= endDate) {
        unifiedEvents.push({
          id: `exam-${exam.id}`,
          title: `${exam.name} Exam`,
          date: exam.examDate.toISOString(),
          type: 'exam',
          source: 'ExamStage',
          examId: exam.id
        });
      }
      
      const checkAndPush = (d: Date | null, titleSuffix: string, type: 'exam' | 'deadline') => {
        if (d && d >= startDate && d <= endDate) {
          unifiedEvents.push({
            id: `exam-${exam.id}-${titleSuffix.replace(/\s+/g, '-')}`,
            title: `${exam.name} - ${titleSuffix}`,
            date: d.toISOString(),
            type,
            source: 'ExamStage',
            examId: exam.id
          });
        }
      };

      checkAndPush(exam.prelimsDate, 'Prelims', 'exam');
      checkAndPush(exam.mainsDate, 'Mains', 'exam');
      checkAndPush(exam.applicationStartDate, 'Application Opens', 'deadline');
      checkAndPush(exam.applicationEndDate, 'Application Deadline', 'deadline');
      checkAndPush(exam.notificationDate, 'Notification', 'deadline');
    });

    // Map StudyTasks
    studyTasks.forEach((task: any) => {
      if (task.scheduledDate) {
        unifiedEvents.push({
          id: `task-${task.id}`,
          title: `Study: ${task.topic?.name || task.title}`,
          date: task.scheduledDate.toISOString(),
          type: 'study',
          source: 'StudyTask',
          examId: task.examId || undefined
        });
      }
    });

    return unifiedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
};
