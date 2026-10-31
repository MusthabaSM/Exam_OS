import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import prisma from "@/lib/db/prisma";
import { parseDocument } from "@/lib/question-import/parser";
import { validatePdfFile } from "@/lib/pdf-validation";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  try {
    const { examId } = await params;
    const userId = await getCurrentUserId();
    
    // Verify exam ownership
    const exam = await prisma.exam.findFirst({
       where: { id: examId, userId }
    });
    if (!exam) {
       return NextResponse.json({ error: "Unauthorized or exam not found" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    const validation = await validatePdfFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let text = "";

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const { extractTextFromPDF } = await import("@/lib/pdf-extractor");
        text = await extractTextFromPDF(Buffer.from(buffer), true);
    } else {
        // Assume text file
        text = buffer.toString("utf-8");
    }
    
    // Pass to our deterministic text parser
    const parsedQuestions = parseDocument([{ text }]);

    return NextResponse.json({ questions: parsedQuestions });
  } catch (error: any) {
    console.error("Parsing Error:", error);
    return NextResponse.json({ error: "Failed to parse questions: " + (error.message || String(error)) }, { status: 500 });
  }
}
