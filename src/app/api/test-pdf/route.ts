export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { extractTextFromPDF } = await import("@/lib/pdf-extractor");
    const text = await extractTextFromPDF(buffer);
    return NextResponse.json({ success: true, length: text.length });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
