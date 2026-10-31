import React from "react";
import ProgressClient from "./ProgressClient";
import { getProgressMetricsAction } from "@/actions/progressActions";

export default async function ProgressPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  
  const res = await getProgressMetricsAction(examId);
  const metrics = res.success ? res.data : {
    readiness: 0,
    accuracy: "0.0",
    questionsSolved: 0,
    studyHours: 0,
    totalTopics: 0,
    completedTopics: 0,
    subjectPerformance: [],
    recentActivity: Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString(), dayName: d.toLocaleDateString('en-US', { weekday: 'short' }), count: 0 };
    }),
  };

  return <ProgressClient examId={examId} metrics={metrics} />;
}
