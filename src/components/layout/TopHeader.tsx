"use client";

import React, { useState } from "react";
import { Search, ChevronRight, User, Settings, LogOut, Monitor } from "lucide-react";
import { usePathname } from "next/navigation";
import { GlobalCommandMenu } from "./GlobalCommandMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopHeader() {
  const pathname = usePathname();
  const [openCommand, setOpenCommand] = useState(false);

  // Simple breadcrumb logic based on pathname
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs = paths.length === 0 ? ["Dashboard"] : paths.map(p => p.charAt(0).toUpperCase() + p.slice(1));

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground-muted">
        <span className="hidden md:inline">Exam OS</span>
        <ChevronRight className="hidden md:inline w-4 h-4" />
        <span className="text-foreground">{breadcrumbs[0]}</span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setOpenCommand(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground-muted bg-surface border border-border rounded-md shadow-sm hover:bg-surface-hover transition-colors w-64 justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>Search exams, notes...</span>
          </div>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-surface-elevated px-1.5 font-mono text-[10px] font-medium text-foreground-muted">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary ring-offset-background">
              <Avatar className="w-8 h-8 border border-border">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">JD</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = "/settings"}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = "/settings"}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Monitor className="mr-2 h-4 w-4" />
              <span>Theme (Coming Soon)</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => alert("Development: Auth not connected.")}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <GlobalCommandMenu open={openCommand} onOpenChange={setOpenCommand} />
    </header>
  );
}
