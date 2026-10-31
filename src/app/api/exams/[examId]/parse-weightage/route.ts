import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { parseWeightageText } from "@/lib/weightage-import/parser";
import { matchExamsSubjectsAndTopics } from "@/lib/weightage-import/matcher";
import { validatePdfFile } from "@/lib/pdf-validation";

export async function POST(req: Request, { params }: { params: Promise<{ examId: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { examId } = await params;
    
    // Verify ownership of the current exam as the entry point
    const currentExam = await prisma.exam.findUnique({ where: { id: examId, userId } });
    if (!currentExam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validation = await validatePdfFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    let text = "";
    
    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      try {
        const buffer = await file.arrayBuffer();
        const { extractTextFromPDF } = await import("@/lib/pdf-extractor");
        text = await extractTextFromPDF(Buffer.from(buffer));
      } catch (err: any) {
        console.error("PDF parse error:", err);
        return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
      }
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      text = await file.text();
    } else {
      return NextResponse.json({ error: "Unsupported file type. Please upload a PDF or TXT." }, { status: 400 });
    }

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "The file appears to be empty or unreadable." }, { status: 400 });
    }

    // 1. Parse text deterministically
    const parsedData = parseWeightageText(text);

    // 2. Fetch all existing exams and their topics for the authenticated user
    const existingExams = await prisma.exam.findMany({
      where: { userId },
      include: {
        subjects: {
          include: {
            topics: true
          }
        }
      }
    });

    const dbExams = existingExams.map(e => ({
      id: e.id,
      name: e.name,
      subjects: e.subjects.map(s => ({
        id: s.id,
        name: s.name,
        topics: s.topics.map(t => ({
          id: t.id,
          name: t.name
        }))
      }))
    }));

    // 3. Match subjects and topics across all exams
    const matchedExams = matchExamsSubjectsAndTopics(parsedData.exams, dbExams);

    return NextResponse.json({ 
      success: true, 
      data: {
        sourceYear: parsedData.sourceYear || null,
        exams: matchedExams
      }
    });

  } catch (error) {
    console.error("API error in parse-weightage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
