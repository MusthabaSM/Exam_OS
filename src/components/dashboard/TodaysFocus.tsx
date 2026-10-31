"use client";

import React from "react";
import Link from "next/link";
import { Clock, CheckCircle2, PlayCircle, ArrowRight, BookOpen, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Autoplay, EffectCreative, Pagination, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-creative";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/autoplay";

// Custom Navigation Component that safely hooks into Swiper instance
const SwiperNavButtons = () => {
  const swiper = useSwiper();
  return (
    <div className="absolute bottom-1 left-0 right-0 z-10 flex justify-between items-center px-2 pointer-events-none">
      <button 
        onClick={() => swiper.slidePrev()} 
        className="pointer-events-auto flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-border text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors shadow-sm"
      >
        <ChevronLeftIcon className="w-4 h-4 -ml-0.5" />
      </button>
      <button 
        onClick={() => swiper.slideNext()} 
        className="pointer-events-auto flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-border text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-colors shadow-sm"
      >
        <ChevronRightIcon className="w-4 h-4 -mr-0.5" />
      </button>
    </div>
  );
};

export function TodaysFocus({ tasks = [] }: { tasks?: { id: string, examId?: string, topic?: string, title?: string, subject?: string, status: string, duration?: string }[] }) {
  const css = `
  .Carousal_005 {
    width: 100%;
    padding-bottom: 30px !important;
  }
  
  .Carousal_005 .swiper-slide {
     border-radius: 25px;
     width: 100% !important;
  }

  .Carousal_005 .swiper-pagination-bullet {
    background-color: hsl(var(--primary)) !important;
  }
  `;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium -tracking-[0.01em] text-foreground">Today&apos;s Focus</h2>
      
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-surface border border-border border-dashed rounded-lg text-center space-y-3">
          <BookOpen className="w-8 h-8 text-foreground-muted/50 mb-1" />
          <p className="text-sm text-foreground-muted">No tasks scheduled for today.</p>
          <Link href="/exams" className="text-xs font-semibold text-primary hover:underline bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors">
            View Exams
          </Link>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative w-full"
        >
          <style>{css}</style>
          
          <Swiper
            spaceBetween={0}
            autoplay={{ delay: 3000, disableOnInteraction: true }}
            effect="creative"
            grabCursor={true}
            slidesPerView={1}
            centeredSlides={true}
            loop={tasks.length > 1}
            pagination={{ clickable: true }}
            className="Carousal_005"
            creativeEffect={{
              prev: { shadow: true, translate: [0, 0, -400] },
              next: { translate: ["100%", 0, 0] },
            }}
            modules={[EffectCreative, Pagination, Navigation, Autoplay]}
          >
            {tasks.map((task) => {
              const isCompleted = task.status === "COMPLETED";
              const isNext = task.status === "IN_PROGRESS" || task.status === "TODO";

              return (
                <SwiperSlide key={task.id}>
                  <div className="w-full h-full min-h-[120px] bg-surface border border-border rounded-3xl p-4 md:p-5 flex flex-col justify-between shadow-sm">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 w-full">
                        <div className="shrink-0 mt-0.5">
                          {isCompleted && <CheckCircle2 className="w-6 h-6 text-success" />}
                          {isNext && <PlayCircle className="w-6 h-6 text-primary" />}
                        </div>
                        <div>
                          <p className={cn(
                            "font-semibold text-lg transition-colors line-clamp-2",
                            isCompleted ? "text-foreground-muted line-through" : "text-foreground"
                          )}>
                            {task.topic || task.title || 'Untitled Task'}
                          </p>
                          {task.subject && task.subject !== 'General' && (
                            <p className="text-sm font-medium text-foreground-muted mt-1">
                              {task.subject}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="flex justify-between items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5 text-foreground-muted text-xs font-medium tabular-nums bg-surface-hover px-2 py-1 rounded-md shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        {task.duration || '-'}
                      </div>
                      
                      <Link href={`/study-plan`} className="flex whitespace-nowrap shrink-0 text-xs font-semibold text-primary hover:bg-primary/20 items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-lg transition-colors">
                        {isNext ? 'Start Task' : 'View Plan'} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
            {tasks.length > 1 && <SwiperNavButtons />}
          </Swiper>
        </motion.div>
      )}
    </div>
  );
}
