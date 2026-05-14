// lib/markdown.js
// Round-trip HTML <-> Markdown so headings, bold, lists, and links
// survive the voice editing loop.

import TurndownService from 'turndown';
import { marked } from 'marked';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '_',
});

// Strip Gutenberg block comments — they confuse markdown conversion.
// WP will re-detect content as "classic" block on save, which is fine for v1.
turndown.addRule('removeGutenbergComments', {
  filter: (node) => node.nodeType === 8, // comment node
  replacement: () => '',
});

export function htmlToMarkdown(html) {
  if (!html) return '';
  return turndown.turndown(html).trim();
}

export function markdownToHtml(md) {
  if (!md) return '';
  return marked.parse(md, { breaks: false, gfm: true });
}
