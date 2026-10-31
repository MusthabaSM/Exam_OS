import React from "react";
import { notFound } from "next/navigation";
import { PreparationOverview } from "@/components/dashboard/PreparationOverview";
import { WeakAreas } from "@/components/dashboard/WeakAreas";
import { TodaysFocus } from "@/components/dashboard/TodaysFocus";
import { RecentMaterials } from "@/components/dashboard/RecentMaterials";
import { getExamDashboardDataAction } from "@/actions/dashboardActions";

export default async function ExamOverviewPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const res = await getExamDashboardDataAction(examId);

  if (!res.success || !res.data) {
    notFound();
  }

  const { metrics, todaysTasks, recentMaterials, weakAreas } = res.data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <PreparationOverview metrics={metrics} />
        <TodaysFocus tasks={todaysTasks} />
      </div>
      <div className="space-y-8">
        <WeakAreas areas={weakAreas} />
        <RecentMaterials materials={recentMaterials} />
      </div>
    </div>
  );
}
