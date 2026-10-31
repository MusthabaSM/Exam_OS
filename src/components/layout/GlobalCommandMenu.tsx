"use client";

import React, { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { 
  LayoutDashboard, 
  Library, 
  CalendarDays, 
  BookOpen, 
  Sparkles,
  Upload,
  Plus
} from "lucide-react";
import { useRouter } from "next/navigation";

export function GlobalCommandMenu({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => router.push("/exams/new"))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Add Exam</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Go to Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/exams"))}>
            <Library className="mr-2 h-4 w-4" />
            <span>Open My Exams</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/progress"))}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Open Progress</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/calendar"))}>
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>Open Calendar</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/notes"))}>
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Open Notes</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/ai"))}>
            <Sparkles className="mr-2 h-4 w-4" />
            <span>Open AI Assistant</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Open Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
