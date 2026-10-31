import React from "react";
import ExamsClient from "./ExamsClient";
import { getExamsAction } from "@/actions/examActions";
import { ExamStatus } from "@prisma/client";
import { progressRepository } from "@/lib/repositories/progressRepository";
import { getCurrentUserId } from "@/lib/auth";

export default async function ExamsPage() {
  const response = await getExamsAction(false);
  const exams = response.success ? response.data : [];
  const userId = await getCurrentUserId();

  // Transform Prisma models into the format the UI currently expects
  // so we don't have to redesign the UI or break its logic.
  const formattedExams = await Promise.all(exams.map(async (exam) => {
    // Calculate a rough countdown based on target dates
    const nextDateObj = exam.examDate || exam.mainsDate || exam.prelimsDate || exam.notificationDate;
    let countdown = 0;
    if (nextDateObj) {
      const diffTime = nextDateObj.getTime() - new Date().getTime();
      countdown = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    
    // Map Prisma enum status to UI expected string
    let status = "Upcoming";
    if (exam.status === ExamStatus.ONGOING) status = "Active";
    else if (exam.status === ExamStatus.COMPLETED) status = "Completed";
    else if (exam.status === ExamStatus.ARCHIVED) status = "Archived";
    else status = "Upcoming";

    const metrics = await progressRepository.getProgressMetrics(exam.id, userId);

    return {
      id: exam.id,
      name: exam.name,
      org: exam.organization || "ORG",
      stage: "Preparation", // This could be derived from exam stages later
      countdown,
      prep: metrics.readiness || 0,
      nextDate: nextDateObj ? nextDateObj.toLocaleDateString() : "TBD",
      prelimsDate: exam.prelimsDate ? exam.prelimsDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null,
      mainsDate: exam.mainsDate ? exam.mainsDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : null,
      lastStudied: "Never", // Mock until study module is ready
      status,
      isDevelopment: exam.isDevelopment,
      minimumQualifyingMarks: exam.minimumQualifyingMarks,
      weightageDistribution: exam.weightageDistribution
    };
  }));

  return <ExamsClient initialExams={formattedExams} />;
}
