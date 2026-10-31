import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.REVALIDATE_SECRET;
    
    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    revalidatePath('/exams/[examId]/topic-weightage', 'page');
    revalidatePath('/exams', 'layout');
    return NextResponse.json({ success: true, message: 'Revalidated' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
