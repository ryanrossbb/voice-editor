import { updatePost } from '@/lib/wordpress';
import { markdownToHtml } from '@/lib/markdown';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request, { params }) {
  try {
    const { content, title } = await request.json();
    const result = await updatePost(params.id, {
      content: content !== undefined ? markdownToHtml(content) : undefined,
      title,
    });
    return Response.json({
      success: true,
      modified: result.modified,
      link: result.link,
    });
  } catch (e) {
    console.error('Post save error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
