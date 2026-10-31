"use client";

import React from "react";
import { motion, Variants } from "motion/react";
import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { TodaysFocus } from "@/components/dashboard/TodaysFocus";
import { UpcomingExams } from "@/components/dashboard/UpcomingExams";
import { PreparationOverview } from "@/components/dashboard/PreparationOverview";
import { WeakAreas } from "@/components/dashboard/WeakAreas";
import { RecentMaterials } from "@/components/dashboard/RecentMaterials";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

export default function DashboardClient({ dashboardData }: { dashboardData: any }) {
  const css = `
    .bento-grid {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr 1.4fr;
      grid-template-rows: auto auto auto;
      gap: 16px;
    }

    .bento-box {
      width: 100%;
      height: 100%;
      border-radius: 22px;
      background: var(--surface);
      border: 1px solid var(--border);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      padding: 24px;
    }

    /* Box 1 (Horizontal wide): Top Left */
    .box-1 { grid-column: 1 / 3; grid-row: 1; padding: 16px; }
    
    /* Box 2 (Vertical tall): Right Corner */
    .box-2 { grid-column: 3; grid-row: 1 / 3; }
    
    /* Box 3 & 4 (Squares): Bottom Left */
    .box-3 { grid-column: 1; grid-row: 2; }
    .box-4 { grid-column: 2; grid-row: 2; }
    
    /* Box 5 (Horizontal wide): Bottom */
    .box-5 { grid-column: 1 / 4; grid-row: 3; }

    /* Tablet */
    @media (max-width: 900px) {
      .bento-grid {
        grid-template-columns: 1fr 1fr;
      }
      .box-1 { grid-column: 1 / 3; grid-row: 1; }
      .box-2 { grid-column: 1 / 3; grid-row: 2; }
      .box-3 { grid-column: 1; grid-row: 3; }
      .box-4 { grid-column: 2; grid-row: 3; }
      .box-5 { grid-column: 1 / 3; grid-row: 4; }
    }

    /* Mobile */
    @media (max-width: 600px) {
      .bento-grid {
        grid-template-columns: 1fr;
      }
      .box-1, .box-2, .box-3, .box-4, .box-5 {
        grid-column: auto;
        grid-row: auto;
      }
    }
    
    /* No extra CSS for nested widgets needed */
  `;

  return (
    <motion.div 
      className="w-full max-w-7xl mx-auto space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <style>{css}</style>
      
      <motion.div variants={itemVariants} className="px-2">
        <GreetingHeader userName={dashboardData.userName} nextTask={dashboardData.todaysTasks?.[0]} />
      </motion.div>
      
      <div className="bento-grid">
        {/* Box 1 (Horizontal wide): Preparation Overview */}
        <motion.div variants={itemVariants} className="bento-box box-1">
          <PreparationOverview metrics={dashboardData.globalMetrics} />
        </motion.div>

        {/* Box 2 (Vertical tall right corner): Upcoming Exams */}
        <motion.div variants={itemVariants} className="bento-box box-2">
          <UpcomingExams exams={dashboardData.upcomingExams} />
        </motion.div>

        {/* Box 3 (Square): Today's Focus */}
        <motion.div variants={itemVariants} className="bento-box box-3">
          <TodaysFocus tasks={dashboardData.todaysTasks} />
        </motion.div>

        {/* Box 4 (Square): Weak Areas */}
        <motion.div variants={itemVariants} className="bento-box box-4">
          <WeakAreas areas={dashboardData.globalMetrics?.weakAreas || []} />
        </motion.div>

        {/* Box 5 (Horizontal wide bottom): Recent Materials */}
        <motion.div variants={itemVariants} className="bento-box box-5">
          <RecentMaterials materials={dashboardData.recentMaterials} />
        </motion.div>
      </div>
    </motion.div>
  );
}
