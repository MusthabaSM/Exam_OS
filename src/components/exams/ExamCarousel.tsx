"use client";
import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';

export function ExamCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: false, align: 'start' });

  return (
    <div className="overflow-hidden w-full" ref={emblaRef}>
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-[0_0_80%] sm:flex-[0_0_40%] min-w-0">
            <div className="bg-surface-elevated border border-border p-6 rounded-lg shadow-sm hover:shadow-md transition-all h-32 flex flex-col justify-between">
              <h3 className="font-semibold text-foreground text-lg">Practice Exam {i}</h3>
              <span className="text-sm text-foreground-muted font-medium uppercase tracking-wider">Start Now &rarr;</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
