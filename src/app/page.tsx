import React from "react";
import DashboardClient from "./DashboardClient";
import { getDashboardDataAction } from "@/actions/dashboardActions";

export default async function Dashboard() {
  const res = await getDashboardDataAction();
  const dashboardData = res.success ? res.data : {
    upcomingExams: [],
    globalMetrics: {
      readiness: 0,
      accuracy: 0,
      studyHours: 0,
      questionsSolved: 0,
      streak: 0,
      weakAreas: []
    },
    todaysTasks: []
  };

  return <DashboardClient dashboardData={dashboardData} />;
}
