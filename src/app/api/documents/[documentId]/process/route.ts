import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { documentProcessingService } from '@/lib/services/documentProcessingService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const { documentId } = await params;
    
    // Attempt to read signedUrl from body if provided
    let signedUrl: string | undefined;
    try {
      const body = await request.json();
      signedUrl = body.signedUrl;
    } catch (e) {
      // Body might be empty or invalid JSON, ignore
    }

    // Trigger processing synchronously so we can return errors if any
    await documentProcessingService.processDocument(documentId, userId, signedUrl);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Process Document Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
