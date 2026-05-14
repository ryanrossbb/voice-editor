import { getPost } from '@/lib/wordpress';
import { htmlToMarkdown } from '@/lib/markdown';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    const post = await getPost(params.id);
    return Response.json({
      id: post.id,
      title: post.title,
      content: htmlToMarkdown(post.content),
      contentFormat: 'markdown',
      status: post.status,
      modified: post.modified,
      link: post.link,
    });
  } catch (e) {
    console.error('Post fetch error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
