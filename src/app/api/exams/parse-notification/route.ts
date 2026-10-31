import { NextRequest, NextResponse } from "next/server";
import { parseExamNotificationText } from "@/lib/utils/pdfParser";
import { validatePdfFile } from "@/lib/pdf-validation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    const validation = await validatePdfFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const { extractTextFromPDF } = await import("@/lib/pdf-extractor");
    const text = await extractTextFromPDF(Buffer.from(buffer));
    
    // Pass to our deterministic text parser
    const parsedData = parseExamNotificationText(text);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    return NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 });
  }
}
