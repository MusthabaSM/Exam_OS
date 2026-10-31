"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { motion } from "motion/react";
import { EffectCreative, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper";
import { useRouter } from "next/navigation";

import "swiper/css";
import "swiper/css/effect-creative";

export function UpcomingExams({ exams = [] }: { exams?: { id: string, name: string, examDate: string | Date | null, prelimsDate?: string | Date | null, mainsDate?: string | Date | null, progress?: number, minimumQualifyingMarks?: string | null, weightageDistribution?: any }[] }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  const displayExams = exams.map((e, i) => {
    // Find the closest upcoming date for the countdown
    const now = new Date().getTime();
    const dates = [e.examDate, e.prelimsDate, e.mainsDate]
      .filter(d => d)
      .map(d => new Date(d as string | Date).getTime())
      .filter(t => t >= now);
      
    const closestDate = dates.length > 0 ? Math.min(...dates) : null;
    const days = closestDate ? Math.max(0, Math.floor((closestDate - now) / (1000 * 60 * 60 * 24))) : 0;
    
    return {
      id: e.id,
      uniqueKey: `${e.id}-${i}`,
      name: e.name,
      days,
      progress: e.progress || 0,
      stage: "Upcoming",
      examDate: e.examDate,
      prelimsDate: e.prelimsDate,
      mainsDate: e.mainsDate,
      minimumQualifyingMarks: e.minimumQualifyingMarks,
      weightageDistribution: e.weightageDistribution,
    };
  });

  const isLoop = displayExams.length > 1;

  // Custom safe keyboard navigation that prevents rapid-fire stuck states
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) return;

      const swiper = swiperRef.current;
      if (!swiper) return;

      // Only slide if not currently animating to prevent breaking the loop state
      if (e.key === "ArrowRight") {
        if (!swiper.animating) swiper.slideNext();
      } else if (e.key === "ArrowLeft") {
        if (!swiper.animating) swiper.slidePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const css = `
  .Carousal_004 {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: visible !important;
  }
  
  .Carousal_004 .swiper-slide {
    width: 100%;
    max-width: 360px;
    height: 100%;
  }
  `;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-xl font-medium -tracking-[0.01em] text-foreground">Upcoming Exams</h2>
        <Link href="/exams" className="text-sm font-medium text-primary hover:underline underline-offset-4 flex items-center gap-1">
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      
      {displayExams.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-surface border border-border border-dashed rounded-lg text-center space-y-3 flex-1">
          <Calendar className="w-8 h-8 text-foreground-muted/50 mb-1" />
          <p className="text-sm text-foreground-muted">No upcoming exams found.</p>
          <Link href="/exams/new" className="text-xs font-semibold text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors">
            Create New Exam
          </Link>
        </div>
      ) : (
        <div className="flex w-full items-center justify-center py-2 flex-1 min-h-0">
          <motion.div
            initial={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              duration: 0.3,
              delay: 0.2,
            }}
            className="relative w-full h-full max-w-4xl flex flex-col items-center"
          >
            <style>{css}</style>

            <Swiper
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
              spaceBetween={0}
              effect="creative"
              grabCursor={true}
              slidesPerView="auto"
              centeredSlides={true}
              loop={isLoop}
              keyboard={false} // Disabled native buggy keyboard, using custom safe one above
              className="Carousal_004"
              creativeEffect={{
                prev: {
                  shadow: false,
                  origin: "left center",
                  translate: ["-5%", 0, -200],
                  rotate: [0, 100, 0],
                },
                next: {
                  shadow: false,
                  origin: "right center",
                  translate: ["5%", 0, -200],
                  rotate: [0, -100, 0],
                },
              }}
              modules={[EffectCreative]}
            >
              {displayExams.map((exam) => (
                <SwiperSlide key={exam.uniqueKey} className="rounded-3xl bg-surface border-2 border-border shadow-xl p-6 flex flex-col cursor-pointer hover:border-primary/50 transition-colors h-full" onClick={() => router.push(`/exams/${exam.id}`)}>
                  <div className="flex justify-between items-start mb-6 shrink-0">
                    <div>
                      <h3 className="font-bold text-lg text-foreground leading-tight line-clamp-2">
                        {exam.name}
                      </h3>
                      <div className="flex gap-3 mt-2">
                        {exam.prelimsDate || exam.mainsDate ? (
                          <>
                            {exam.prelimsDate && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">Prelims</span>
                                <p className="text-xs font-semibold text-foreground" suppressHydrationWarning>
                                  {new Date(exam.prelimsDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            )}
                            {exam.mainsDate && (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">Mains</span>
                                <p className="text-xs font-semibold text-foreground" suppressHydrationWarning>
                                  {new Date(exam.mainsDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">Exam Date</span>
                            <p className="text-xs font-semibold text-foreground" suppressHydrationWarning>
                              {exam.examDate ? new Date(exam.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Date TBD"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto space-y-6 flex-1 flex flex-col justify-end">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-6xl font-black tracking-tight text-foreground">{exam.days}</span>
                      <span className="text-base font-bold text-foreground-muted">days</span>
                    </div>

                    <div className="space-y-3">
                      {(exam.minimumQualifyingMarks || (exam.weightageDistribution && Object.keys(exam.weightageDistribution).length > 0)) && (
                        <div className="flex flex-col gap-1.5 text-xs">
                          {exam.minimumQualifyingMarks && (
                            <div className="flex justify-between items-center text-foreground-muted">
                              <span>Qualifying Marks</span>
                              <span className="font-semibold text-foreground">{exam.minimumQualifyingMarks}</span>
                            </div>
                          )}
                          {exam.weightageDistribution && Object.keys(exam.weightageDistribution).length > 0 && (
                            <div className="flex flex-col text-right w-full gap-0.5">
                              {Object.entries(exam.weightageDistribution).map(([k, v]) => (
                                <span key={k} className="font-semibold text-foreground whitespace-normal break-words w-full text-[11px]" title={`${k}: ${v}`}>
                                  {k}: {String(v)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm font-bold pt-1">
                        <span className="text-foreground-muted uppercase tracking-wider text-[10px]">Prepared</span>
                        <span className="tabular-nums text-foreground">{exam.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${exam.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Custom Pagination Dots */}
            {isLoop && (
              <div className="flex justify-center gap-2 mt-6 z-10 shrink-0">
                {displayExams.map((_, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (swiperRef.current) {
                        swiperRef.current.slideToLoop(idx);
                      }
                    }}
                    className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${activeIndex === idx ? 'w-6 bg-primary' : 'w-2 bg-primary/20 hover:bg-primary/40'}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
