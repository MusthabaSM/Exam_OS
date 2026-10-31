"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Filter, MoreHorizontal, Calendar, Clock, BookOpen, Edit, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { archiveExamAction } from "@/actions/examActions";
import { SmoothInput } from "@/components/ui/SmoothInput";



type ExamProps = {
  id: string;
  name: string;
  org: string;
  stage: string;
  countdown: number;
  prep: number;
  nextDate: string;
  lastStudied: string;
  status: string;
  isDevelopment?: boolean;
  minimumQualifyingMarks?: string | null;
  weightageDistribution?: any;
  prelimsDate?: string | null;
  mainsDate?: string | null;
};

export default function ExamsClient({ initialExams }: { initialExams: ExamProps[] }) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isArchiving, setIsArchiving] = useState<string | null>(null);

  const handleArchive = async (e: React.MouseEvent, examId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("Are you sure you want to archive this exam?")) {
      setIsArchiving(examId);
      try {
        await archiveExamAction(examId);
      } catch (err) {
        console.error("Failed to archive:", err);
      } finally {
        setIsArchiving(null);
      }
    }
  };

  const filteredExams = initialExams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(search.toLowerCase()) || exam.org.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === "All" || exam.status === activeFilter;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => a.countdown - b.countdown);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold -tracking-[0.02em] text-foreground">My Exams</h1>
          <p className="text-foreground-muted mt-2">All examinations you&apos;re preparing for.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/exams/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Exam
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <SmoothInput 
            type="text" 
            placeholder="Search exams..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {["All", "Active", "Upcoming", "Completed", "Archived"].map((filter) => (
            <button 
              key={filter} 
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeFilter === filter ? 'bg-primary/10 text-primary' : 'bg-surface border border-border text-foreground-muted hover:text-foreground'}`}
            >
              {filter}
            </button>
          ))}
          <Button variant="outline" size="icon" className="h-8 w-8 ml-auto sm:ml-0 shrink-0 rounded-full" onClick={() => alert("Advanced filters not connected yet")}>
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <HoverExpandExams 
        exams={filteredExams} 
        handleArchive={handleArchive} 
        isArchiving={isArchiving} 
      />
    </div>
  );
}

function HoverExpandExams({
  exams,
  handleArchive,
  isArchiving
}: {
  exams: ExamProps[];
  handleArchive: (e: React.MouseEvent, examId: string) => Promise<void>;
  isArchiving: string | null;
}) {
  const [activeExam, setActiveExam] = useState<string | null>(exams.length > 0 ? exams[0].id : "create");
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const gradients = [
    "from-blue-600 to-indigo-800",
    "from-emerald-500 to-teal-800",
    "from-violet-600 to-fuchsia-800",
    "from-orange-500 to-rose-700",
    "from-cyan-600 to-blue-800",
    "from-rose-500 to-pink-800",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full mt-8"
    >
      <div className="flex w-full flex-col md:flex-row items-stretch justify-start gap-3 h-[700px] md:h-[450px] overflow-auto hide-scrollbar pb-2">
        {/* Create Exam Card */}
        <motion.div
          className="relative cursor-pointer overflow-hidden rounded-3xl bg-surface border-2 border-border border-dashed flex-shrink-0"
          initial={{ height: "4rem", width: "4rem" }}
          animate={{
            height: activeExam === "create" ? (isMobile ? "300px" : "100%") : (isMobile ? "4.5rem" : "100%"),
            width: activeExam === "create" ? (isMobile ? "100%" : "22rem") : (isMobile ? "100%" : "5rem"),
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          onClick={() => setActiveExam("create")}
          onHoverStart={() => {
            if (!isMobile) setActiveExam("create");
          }}
        >
          <Link href="/exams/new" className="absolute inset-0 flex flex-col items-center justify-center p-4 hover:bg-surface-hover transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <AnimatePresence>
              {activeExam === "create" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <h3 className="font-semibold text-lg text-foreground">Create Exam</h3>
                  <p className="text-xs text-foreground-muted mt-1">Import or manual entry</p>
                </motion.div>
              )}
            </AnimatePresence>
            {activeExam !== "create" && (
              <span className="hidden md:block absolute -rotate-90 whitespace-nowrap text-xs font-semibold text-foreground-muted tracking-widest uppercase">
                New Exam
              </span>
            )}
            {activeExam !== "create" && isMobile && (
              <span className="block whitespace-nowrap text-xs font-semibold text-foreground-muted tracking-widest uppercase">
                New Exam
              </span>
            )}
          </Link>
        </motion.div>

        {/* Exam Cards */}
        {exams.map((exam, index) => {
          const isActive = activeExam === exam.id;
          const gradient = gradients[index % gradients.length];

          return (
            <motion.div
              key={exam.id}
              className={`relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} flex-shrink-0 flex items-center justify-center`}
              initial={{ height: "4rem", width: "4rem" }}
              animate={{
                height: isActive ? (isMobile ? "450px" : "100%") : (isMobile ? "4.5rem" : "100%"),
                width: isActive ? (isMobile ? "100%" : "26rem") : (isMobile ? "100%" : "5rem"),
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              onClick={() => setActiveExam(exam.id)}
              onHoverStart={() => {
                if (!isMobile) setActiveExam(exam.id);
              }}
            >
              {/* Collapsed State Content */}
              <AnimatePresence>
                {!isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center p-3"
                  >
                    <span className="md:-rotate-90 whitespace-nowrap text-sm font-bold text-white/90 tracking-widest uppercase">
                      {exam.org.substring(0, 15)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Expanded State Content */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col p-6 bg-black/10"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="pr-2">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                            {exam.org}
                          </span>
                          {exam.isDevelopment && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-black bg-warning px-2 py-1 rounded backdrop-blur-sm">
                              DEMO
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-2xl text-white leading-tight drop-shadow-md">
                          {exam.name}
                        </h3>
                        <p className="text-sm font-medium text-white/80 mt-1">{exam.stage}</p>
                      </div>
                      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="z-10 relative">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button 
                              className="text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 rounded-full backdrop-blur-sm transition-colors"
                              disabled={isArchiving === exam.id}
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white text-slate-900 border-slate-200">
                            <Link href={`/exams/${exam.id}/edit`}>
                              <DropdownMenuItem className="cursor-pointer focus:bg-slate-100 hover:bg-slate-100">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Exam
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem 
                              className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 hover:bg-red-50"
                              onClick={(e) => handleArchive(e, exam.id)}
                              disabled={isArchiving === exam.id}
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              {isArchiving === exam.id ? "Archiving..." : "Archive Exam"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="mt-auto space-y-5 bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-xl">
                      {(exam.minimumQualifyingMarks || (exam.weightageDistribution && Object.keys(exam.weightageDistribution).length > 0)) && (
                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/10">
                          {exam.minimumQualifyingMarks && (
                            <div>
                              <p className="text-[10px] font-medium uppercase tracking-wider text-white/50 mb-0.5">Qualifying</p>
                              <p className="text-sm font-semibold text-white">{exam.minimumQualifyingMarks}</p>
                            </div>
                          )}
                          {exam.weightageDistribution && Object.keys(exam.weightageDistribution).length > 0 && (
                            <div className={!exam.minimumQualifyingMarks ? 'col-span-2' : ''}>
                              <p className="text-[10px] font-medium uppercase tracking-wider text-white/50 mb-0.5">Weightage</p>
                              <div className="flex flex-col gap-1">
                                {Object.entries(exam.weightageDistribution).map(([k, v]) => (
                                  <p key={k} className="text-[11px] font-semibold text-white whitespace-normal break-words leading-tight" title={`${k}: ${v}`}>
                                    {k}: {String(v)}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                          <div className="bg-white/20 p-2 rounded-lg">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold tracking-tight">{exam.countdown}</span>
                              <span className="text-xs font-medium text-white/70">days</span>
                            </div>
                          </div>
                        </div>
                        {exam.prelimsDate || exam.mainsDate ? (
                          <div className="flex gap-4">
                            {exam.prelimsDate && (
                              <div className="text-right">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-white/50 mb-0.5">Prelims</p>
                                <p className="text-sm font-semibold text-white">{exam.prelimsDate}</p>
                              </div>
                            )}
                            {exam.mainsDate && (
                              <div className="text-right">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-white/50 mb-0.5">Mains</p>
                                <p className="text-sm font-semibold text-white">{exam.mainsDate}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-white/50 mb-0.5">Next Date</p>
                            <p className="text-sm font-semibold text-white">{exam.nextDate}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-white/70 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" /> Preparation
                          </span>
                          <span className="text-white tabular-nums">{exam.prep}%</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ width: `${exam.prep}%` }} />
                        </div>
                      </div>
                    </div>
                    
                    <Link href={`/exams/${exam.id}`} className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-xl backdrop-blur-md transition-colors text-center border border-white/10">
                      Open Workspace
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      {exams.length === 0 && (
        <div className="text-center py-12 border border-border border-dashed rounded-xl flex flex-col items-center justify-center space-y-4">
          <p className="text-foreground-muted">No exams found matching your criteria.</p>
        </div>
      )}
    </motion.div>
  );
}
