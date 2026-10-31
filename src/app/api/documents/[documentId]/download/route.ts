import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { documentId } = await params;

    // Verify ownership
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { exam: true },
    });

    if (!document) {
      return new NextResponse('Not found', { status: 404 });
    }
    if (document.exam.userId !== userId) {
      return new NextResponse('Unauthorized', { status: 403 });
    }
    if (!document.storageKey) {
      return new NextResponse('Document has no storage key', { status: 400 });
    }

    const supabase = await createClient();
    
    // Download directly from the server to bypass browser CORS policies
    const { data, error } = await supabase.storage
      .from('exam-documents')
      .download(document.storageKey);

    if (error || !data) {
      return new NextResponse(`Storage Error: ${error?.message || 'Unknown'}`, { status: 500 });
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${document.originalFilename}"`,
      },
    });
  } catch (error: any) {
    console.error('API Download Document Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
