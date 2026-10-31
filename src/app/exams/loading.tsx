"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ExamsListSkeleton } from "@/components/loading/skeletons/ExamsListSkeleton";
import { ExamDetailsSkeleton } from "@/components/loading/skeletons/ExamDetailsSkeleton";
import { GridSkeleton } from "@/components/loading/skeletons/GridSkeleton";
import { GlobalLoader } from "@/components/loading/GlobalLoader";
import { ExamLayoutSkeletonWrapper } from "@/components/loading/skeletons/ExamLayoutSkeletonWrapper";

export default function Loading() {
  const pathname = usePathname() || "";

  const renderLayout = (Skeleton: React.ComponentType, message: string, useWrapper: boolean = false) => (
    <div className="w-full">
      <div className="pointer-events-none w-full" aria-hidden="true">
        {useWrapper ? (
          <ExamLayoutSkeletonWrapper>
            <Skeleton />
          </ExamLayoutSkeletonWrapper>
        ) : (
          <Skeleton />
        )}
      </div>
      <div className="fixed top-0 left-0 md:left-64 right-0 bottom-0 z-[100] flex items-center justify-center pointer-events-none">
        <GlobalLoader message={message} size={120} />
      </div>
    </div>
  );

  if (pathname.includes("/materials")) return renderLayout(GridSkeleton, "Loading materials...", true);
  if (pathname.includes("/practice")) return renderLayout(GridSkeleton, "Loading practice sessions...", true);
  if (pathname.includes("/progress")) return renderLayout(GridSkeleton, "Loading progress...", true);
  if (pathname.includes("/study-plan")) return renderLayout(GridSkeleton, "Loading study plan...", true);
  if (pathname.includes("/syllabus")) return renderLayout(GridSkeleton, "Loading syllabus...", true);
  
  // Matches exact exam detail route like /exams/123
  if (pathname.match(/\/exams\/[a-zA-Z0-9_-]+$/)) return renderLayout(ExamDetailsSkeleton, "Loading exam workspace...", true);
  
  // Default to Exams List
  return renderLayout(ExamsListSkeleton, "Loading exams...", false);
}
