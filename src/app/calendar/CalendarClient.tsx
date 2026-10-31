"use client";

import React, { useState, useEffect, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCalendarEventsAction } from "@/actions/calendarActions";

type UnifiedCalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: 'exam' | 'deadline' | 'study' | 'other';
  source: 'CalendarEvent' | 'ExamStage' | 'StudyTask';
  examId?: string;
};

export default function CalendarClient({ initialEvents }: { initialEvents: UnifiedCalendarEvent[] }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [events, setEvents] = useState<UnifiedCalendarEvent[]>(initialEvents);
  const [isPending, startTransition] = useTransition();

  // Re-fetch events when month changes
  useEffect(() => {
    if (monthOffset !== 0) {
      startTransition(async () => {
        const d = new Date();
        d.setMonth(d.getMonth() + monthOffset);
        
        // start of month - 7 days
        const startDate = new Date(d.getFullYear(), d.getMonth(), -7);
        // end of month + 7 days
        const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 7);
        
        const res = await getCalendarEventsAction(startDate.toISOString(), endDate.toISOString());
        if (res.success && res.data) {
          setEvents(res.data);
        }
      });
    } else {
      setEvents(initialEvents);
    }
  }, [monthOffset, initialEvents]);

  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + monthOffset);

  const getMonthName = () => {
    return baseDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Calculate days for the calendar grid
  const getCalendarDays = () => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const calendarDays = [];
    
    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      calendarDays.push({ date: d, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      calendarDays.push({ date: d, isCurrentMonth: true });
    }
    
    // Next month days (fill to complete weeks, usually 35 or 42 slots)
    const totalSlots = calendarDays.length > 35 ? 42 : 35;
    const remainingSlots = totalSlots - calendarDays.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      calendarDays.push({ date: d, isCurrentMonth: false });
    }
    
    return calendarDays;
  };

  const calendarDays = getCalendarDays();
  const today = new Date();

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold -tracking-[0.02em] text-foreground">Calendar</h1>
          <p className="text-foreground-muted mt-2">Your preparation timeline and important dates.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-surface border border-border rounded-md">
            <button className="p-2 hover:bg-surface-hover text-foreground-muted hover:text-foreground" onClick={() => setMonthOffset(prev => prev - 1)} disabled={isPending}><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-4 text-sm font-medium min-w-[140px] text-center">
              {isPending ? 'Loading...' : getMonthName()}
            </span>
            <button className="p-2 hover:bg-surface-hover text-foreground-muted hover:text-foreground" onClick={() => setMonthOffset(prev => prev + 1)} disabled={isPending}><ChevronRight className="w-4 h-4" /></button>
          </div>
          <Button variant="outline" onClick={() => setMonthOffset(0)}>Today</Button>
        </div>
      </header>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
        <div className="grid grid-cols-7 border-b border-border bg-surface-elevated">
          {days.map(d => (
            <div key={d} className="p-3 text-center text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[120px] bg-border gap-px">
          {calendarDays.map((d, i) => {
            const isToday = d.date.getDate() === today.getDate() && d.date.getMonth() === today.getMonth() && d.date.getFullYear() === today.getFullYear();
            
            // Find events for this day
            const dayEvents = events.filter(e => {
              const eDate = new Date(e.date);
              return eDate.getDate() === d.date.getDate() && 
                     eDate.getMonth() === d.date.getMonth() && 
                     eDate.getFullYear() === d.date.getFullYear();
            });

            return (
              <div key={i} className={`bg-surface p-2 flex flex-col transition-colors hover:bg-surface-hover cursor-pointer ${d.isCurrentMonth ? '' : 'bg-surface/50 opacity-50'}`}>
                <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                  {d.date.getDate()}
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto hide-scrollbar">
                  {dayEvents.map((e) => (
                    <div key={e.id} className={`text-[10px] px-1.5 py-1 rounded truncate font-medium ${
                      e.type === 'exam' ? 'bg-primary/20 text-primary border border-primary/20' :
                      e.type === 'deadline' ? 'bg-destructive/20 text-destructive border border-destructive/20' :
                      'bg-success/20 text-success border border-success/20'
                    }`} title={e.title}>
                      {e.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
