// lib/wordpress.js
// Server-only helpers for talking to the WordPress REST API.
// Uses Application Passwords (built into WordPress 5.6+, no plugin needed).

const WP_SITE_URL = process.env.WP_SITE_URL?.replace(/\/$/, '');
const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;

function getAuthHeader() {
  if (!WP_USERNAME || !WP_APP_PASSWORD) return null;
  const creds = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');
  return `Basic ${creds}`;
}

export function isConfigured() {
  return !!(WP_SITE_URL && WP_USERNAME && WP_APP_PASSWORD);
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function listDrafts() {
  if (!isConfigured()) throw new Error('WordPress not configured');

  const params = new URLSearchParams({
    status: 'draft,pending,private,future',
    per_page: '50',
    orderby: 'modified',
    order: 'desc',
    context: 'edit',
  });

  const url = `${WP_SITE_URL}/wp-json/wp/v2/posts?${params}`;
  const response = await fetch(url, {
    headers: { Authorization: getAuthHeader() },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WordPress API ${response.status}: ${text.slice(0, 200)}`);
  }

  const posts = await response.json();

  return posts.map((p) => ({
    id: p.id,
    title: (p.title?.raw || p.title?.rendered || '(Untitled)').trim(),
    status: p.status,
    modified: p.modified,
    excerpt: stripHtml(p.content?.rendered || p.content?.raw || '').slice(0, 160),
    link: p.link,
    wordCount: stripHtml(p.content?.rendered || p.content?.raw || '').split(/\s+/).filter(Boolean).length,
  }));
}

export async function getPost(id) {
  if (!isConfigured()) throw new Error('WordPress not configured');

  const url = `${WP_SITE_URL}/wp-json/wp/v2/posts/${id}?context=edit`;
  const response = await fetch(url, {
    headers: { Authorization: getAuthHeader() },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WordPress API ${response.status}: ${text.slice(0, 200)}`);
  }

  const post = await response.json();

  return {
    id: post.id,
    title: post.title?.raw || post.title?.rendered || '',
    content: post.content?.raw || post.content?.rendered || '',
    status: post.status,
    modified: post.modified,
    link: post.link,
  };
}

export async function updatePost(id, { content, title }) {
  if (!isConfigured()) throw new Error('WordPress not configured');

  const body = {};
  if (content !== undefined) body.content = content;
  if (title !== undefined) body.title = title;

  const url = `${WP_SITE_URL}/wp-json/wp/v2/posts/${id}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WordPress API ${response.status}: ${text.slice(0, 200)}`);
  }

  return response.json();
}
