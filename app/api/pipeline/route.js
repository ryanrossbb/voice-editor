import { fetchPipeline, isConfigured } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (!isConfigured()) {
    return Response.json({ notConfigured: true, items: [] });
  }
  try {
    const result = await fetchPipeline();
    return Response.json(result);
  } catch (e) {
    console.error('Pipeline fetch error:', e);
    return Response.json({ error: e.message, items: [] }, { status: 500 });
  }
}
