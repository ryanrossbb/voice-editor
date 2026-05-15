// lib/markdown.js
// Round-trip HTML <-> Markdown so headings, bold, lists, and links
// survive the voice editing loop. Strips out non-content tags like
// <style> and <script> so they don't end up in the editor.

import TurndownService from 'turndown';
import { marked } from 'marked';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '_',
});

turndown.addRule('removeGutenbergComments', {
  filter: (node) => node.nodeType === 8, // comment node
  replacement: () => '',
});

turndown.remove(['style', 'script', 'noscript', 'head', 'meta', 'link']);

export function htmlToMarkdown(html) {
  if (!html) return '';
  const cleaned = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '');
  return turndown.turndown(cleaned).trim();
}

export function markdownToHtml(md) {
  if (!md) return '';
  return marked.parse(md, { breaks: false, gfm: true });
}
