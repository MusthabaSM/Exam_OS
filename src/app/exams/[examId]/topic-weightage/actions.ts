'use server';

import prisma from '@/lib/db/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { MatchedSubjectWeightage, MatchedExamWeightage } from '@/lib/weightage-import/matcher';

export async function getExamTopicWeightages(examId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Unauthorized');

  // Verify ownership
  const exam = await prisma.exam.findUnique({
    where: { id: examId, userId },
    include: {
      subjectWeightages: {
        where: { userId }
      },
      subjects: {
        include: {
          topics: {
            include: {
              topicWeightages: {
                where: { userId }
              },
              studyTasks: {
                where: { userId }
              }
            }
          },
          studyTasks: {
            where: { userId }
          }
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!exam) throw new Error('Exam not found or unauthorized');

  const distinctSourceYears = new Set<string>();
  exam.subjectWeightages.forEach(sw => { if (sw.sourceYear) distinctSourceYears.add(sw.sourceYear); });
  exam.subjects.forEach(s => s.topics.forEach(t => t.topicWeightages.forEach(tw => { if (tw.sourceYear) distinctSourceYears.add(tw.sourceYear); })));
  
  const phases = Array.from(distinctSourceYears).sort();
  const resultPhases = [];

  for (const phase of phases) {
    const phaseSubjects = [];
    for (const subject of exam.subjects) {
      const explicitSubjWeightages = exam.subjectWeightages.filter(sw => sw.subjectId === subject.id && sw.sourceYear === phase);
      const explicitSubjWeightage = explicitSubjWeightages.length > 0 ? explicitSubjWeightages[0] : null;

      let subjectProgress: number | null = null;
      const allSubjectTasks = [...subject.studyTasks];
      subject.topics.forEach(t => allSubjectTasks.push(...t.studyTasks));
      if (allSubjectTasks.length > 0) {
        subjectProgress = Math.round((allSubjectTasks.filter(t => t.status === 'COMPLETED').length / allSubjectTasks.length) * 100);
      }

      let subjectPriorityScore = 0;
      const marksWeight = explicitSubjWeightage?.marksCount || explicitSubjWeightage?.weightage || explicitSubjWeightage?.questionCount;
      if (marksWeight) {
         subjectPriorityScore = marksWeight * (100 - (subjectProgress ?? 0));
      } else if (explicitSubjWeightage?.priorityRank) {
         subjectPriorityScore = 1000 - explicitSubjWeightage.priorityRank * 10;
      }

      const topicsResult = [];
      for (const topic of subject.topics) {
        const explicitWeightages = topic.topicWeightages.filter(tw => tw.sourceYear === phase);
        const explicitWeightage = explicitWeightages.length > 0 ? explicitWeightages[0] : null;

        let progress: number | null = null;
        if (topic.studyTasks.length > 0) {
          progress = Math.round((topic.studyTasks.filter(t => t.status === 'COMPLETED').length / topic.studyTasks.length) * 100);
        }

        let priorityScore = 0;
        const topicWeight = explicitWeightage?.marksCount || explicitWeightage?.weightage || explicitWeightage?.questionCount;
        if (topicWeight) {
           priorityScore = topicWeight * (100 - (progress ?? 0));
        } else if (explicitWeightage?.priorityRank) {
           priorityScore = 1000 - explicitWeightage.priorityRank * 10;
        }

        topicsResult.push({
          topicId: topic.id,
          topicName: topic.name,
          weightage: explicitWeightage?.weightage ?? null,
          questionCount: explicitWeightage?.questionCount ?? null,
          marksCount: explicitWeightage?.marksCount ?? null,
          estimatedDifficulty: explicitWeightage?.estimatedDifficulty ?? explicitSubjWeightage?.estimatedDifficulty ?? 'Not specified',
          sourcePriority: explicitWeightage?.priorityRank ?? null,
          progress,
          priorityScore
        });
      }

      topicsResult.sort((a, b) => b.priorityScore - a.priorityScore);

      // Only include subject if it has weightage OR if any of its topics have weightage
      const hasSubjWeightage = !!explicitSubjWeightage;
      const hasTopicWeightage = topicsResult.some(t => t.weightage !== null || t.questionCount !== null || t.marksCount !== null || t.sourcePriority !== null);

      if (hasSubjWeightage || hasTopicWeightage) {
        phaseSubjects.push({
          subjectId: subject.id,
          subjectName: subject.name,
          weightage: explicitSubjWeightage?.weightage ?? null,
          questionCount: explicitSubjWeightage?.questionCount ?? null,
          marksCount: explicitSubjWeightage?.marksCount ?? null,
          estimatedDifficulty: explicitSubjWeightage?.estimatedDifficulty ?? 'Not specified',
          studyRecommendation: explicitSubjWeightage?.studyRecommendation ?? null,
          sourcePriority: explicitSubjWeightage?.priorityRank ?? null,
          progress: subjectProgress,
          priorityScore: subjectPriorityScore,
          topics: topicsResult
        });
      }
    }
    phaseSubjects.sort((a, b) => b.priorityScore - a.priorityScore);
    resultPhases.push({
      phaseName: phase,
      subjects: phaseSubjects
    });
  }

  let parsedPatternData: Record<string, any> | null = null;
  if (exam.examPatternData) {
     if (typeof exam.examPatternData === 'string') {
        try { parsedPatternData = JSON.parse(exam.examPatternData); } catch(e) {}
     } else if (typeof exam.examPatternData === 'object') {
        parsedPatternData = exam.examPatternData as Record<string, any>;
     }
  }

  // If no phases, fallback to empty subjects to avoid breaking the UI
  const defaultSubjects = resultPhases.length > 0 ? resultPhases[0].subjects : [];

  return {
    examName: exam.name,
    examPatternData: parsedPatternData,
    phases: resultPhases,
    subjects: defaultSubjects
  };
}

export async function saveTopicWeightages(sourceYear: string | null, records: MatchedExamWeightage[]) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Unauthorized');

  let imported = 0;
  let skipped = 0;

  const sourceName = sourceYear ? `PDF (${sourceYear})` : 'Imported PDF';
  const safeSourceYear = sourceYear || 'DEFAULT';

  // We wrap all database operations in a single transaction
  await prisma.$transaction(async (tx) => {
    for (const exam of records) {
      if (!exam.isMatched || !exam.examId) continue;

      // Verify exam ownership within transaction
      const dbExam = await tx.exam.findUnique({ where: { id: exam.examId, userId } });
      if (!dbExam) continue; // Skip if user doesn't own this exam

      for (const subject of exam.subjects) {
        if (!subject.isMatched || !subject.subjectId) continue;

        // Save SubjectWeightage
        const existingSubj = await tx.subjectWeightage.findUnique({
          where: {
            userId_examId_subjectId_sourceYear: {
              userId,
              examId: exam.examId,
              subjectId: subject.subjectId,
              sourceYear: safeSourceYear
            }
          }
        });

        if (existingSubj) {
          skipped++;
        } else {
          await tx.subjectWeightage.create({
            data: {
              userId,
              examId: exam.examId,
              subjectId: subject.subjectId,
              sourceName,
              sourceYear: safeSourceYear,
              weightage: subject.weightage,
              questionCount: subject.questionCount,
              marksCount: subject.marksCount,
              priorityRank: subject.priorityRank,
              estimatedDifficulty: subject.estimatedDifficulty,
              studyRecommendation: subject.studyRecommendation
            }
          });
          imported++;
        }

        // Save TopicWeightages
        for (const topic of subject.topics) {
          if (!topic.isMatched || !topic.topicId) continue;

          const existingTopic = await tx.topicWeightage.findUnique({
            where: {
              userId_examId_topicId_sourceYear: {
                userId,
                examId: exam.examId,
                topicId: topic.topicId,
                sourceYear: safeSourceYear
              }
            }
          });

          if (existingTopic) {
            skipped++;
          } else {
            await tx.topicWeightage.create({
              data: {
                userId,
                examId: exam.examId,
                subjectId: subject.subjectId,
                topicId: topic.topicId,
                sourceName,
                sourceYear: safeSourceYear,
                weightage: topic.weightage,
                questionCount: topic.questionCount,
                marksCount: subject.marksCount ? undefined : topic.questionCount, // fallback or exact if available
              }
            });
            imported++;
          }
        }
      }

      // Revalidate the path for each modified exam
      revalidatePath(`/exams/${exam.examId}/topic-weightage`);
    }
  });

  return { success: true, imported, skipped };
}
