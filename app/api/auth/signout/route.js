import { createClient, isConfigured } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request) {
  if (isConfigured()) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
  return NextResponse.json({ ok: true });
}
