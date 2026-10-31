"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, BookOpen, PenTool, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { name: "Home", href: "/", icon: Home },
  { name: "Exams", href: "/exams", icon: Library },
  { name: "Progress", href: "/progress", icon: BookOpen },
  { name: "Calendar", href: "/calendar", icon: PenTool },
  { name: "AI", href: "/ai", icon: Sparkles },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border pb-safe">
      <ul className="flex items-center justify-around h-16">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.name} className="flex-1">
              <Link
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 w-full h-full text-foreground-muted"
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 ease-out",
                    isActive ? "bg-primary/10 text-foreground" : "text-foreground-muted"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-foreground font-semibold" : "text-foreground-muted"
                  )}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
