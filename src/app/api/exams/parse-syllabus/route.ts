import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { validatePdfFile } from "@/lib/pdf-validation";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const { parseSyllabusText } = await import('@/lib/syllabus-import/parser');
    const finalData = parseSyllabusText(text);

    return NextResponse.json({ success: true, data: finalData });

  } catch (error) {
    console.error("API error in parse-syllabus:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
