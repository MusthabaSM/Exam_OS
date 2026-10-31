"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Library, 
  CalendarDays, 
  BookOpen, 
  PenTool, 
  LineChart, 
  Calendar, 
  StickyNote, 
  Sparkles, 
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "My Exams", href: "/exams", icon: Library },
  { name: "Study Plan", href: "/study-plan", icon: CalendarDays },
  { name: "Progress", href: "/progress", icon: LineChart },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Notes", href: "/notes", icon: StickyNote },
  { name: "AI Assistant", href: "/ai", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface min-h-screen">
      <div className="p-6 h-16 flex items-center border-b border-border">
        <h2 className="font-semibold text-lg tracking-tight text-primary">Exam OS</h2>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-out",
                isActive 
                  ? "bg-primary/10 text-foreground shadow-sm" 
                  : "text-foreground-muted hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-foreground-muted group-hover:text-foreground")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors duration-150 ease-out"
        >
          <Settings className="w-4 h-4 text-foreground-muted" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
