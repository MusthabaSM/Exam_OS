import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import Link from "next/link";
import { PenTool, ArrowRight } from "lucide-react";

export default async function GlobalPracticePage() {
  const userId = await getCurrentUserId();
  
  const exams = await prisma.exam.findMany({
    where: { userId },
    select: { id: true, name: true, organization: true }
  });

  if (exams.length === 0) {
    redirect("/exams/new");
  }

  if (exams.length === 1) {
    redirect(`/exams/${exams[0].id}/practice`);
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8 mt-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <PenTool className="w-8 h-8 text-primary" />
          Select an Exam to Practice
        </h1>
        <p className="text-foreground-muted">
          Choose which exam you would like to practice for today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map(exam => (
          <Link href={`/exams/${exam.id}/practice`} key={exam.id}>
            <div className="group p-6 bg-surface border border-border rounded-xl hover:border-primary/50 hover:bg-surface-hover transition-all cursor-pointer">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                    {exam.name}
                  </h3>
                  <p className="text-sm text-foreground-muted mt-1">
                    {exam.organization || "No Organization"}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-foreground-muted group-hover:text-primary transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
