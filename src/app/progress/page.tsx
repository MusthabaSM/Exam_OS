

import React from "react";
import GlobalProgressClient from "./GlobalProgressClient";
import { getDashboardDataAction } from "@/actions/dashboardActions";

export default async function GlobalProgressPage() {
  const res = await getDashboardDataAction();
  const dashboardData = res.success ? res.data : {
    globalMetrics: {
      readiness: 0,
      accuracy: 0,
      questionsSolved: 0,
      studyHours: 0,
      streak: 0,
      weakAreas: [],
    },
    upcomingExams: [],
  };

  return <GlobalProgressClient dashboardData={dashboardData} />;
}
