import { listDrafts, isConfigured } from '@/lib/wordpress';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (!isConfigured()) {
    return Response.json({ notConfigured: true, drafts: [] });
  }
  try {
    const drafts = await listDrafts();
    return Response.json({ drafts });
  } catch (e) {
    console.error('Drafts fetch error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
