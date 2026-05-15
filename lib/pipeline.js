// lib/pipeline.js
// Reads upcoming articles / keywords from a published Google Sheet (CSV format).
// Recognizes a wide variety of column names so most editorial calendars work as-is.

import Papa from 'papaparse';

export function isConfigured() {
  return !!process.env.GOOGLE_SHEET_CSV_URL;
}

function pickField(row, ...keys) {
  for (const key of keys) {
    if (row[key] && String(row[key]).trim()) return String(row[key]).trim();
  }
  return '';
}

export async function fetchPipeline() {
  if (!isConfigured()) {
    return { notConfigured: true, items: [] };
  }

  const response = await fetch(process.env.GOOGLE_SHEET_CSV_URL, {
    cache: 'no-store',
    headers: { 'User-Agent': 'voice-editor/3.0' },
  });

  if (!response.ok) {
    throw new Error(`Google Sheet returned ${response.status}`);
  }

  const text = await response.text();
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const items = parsed.data
    .map((row) => ({
      title: pickField(row, 'Title', 'title', 'Post Title', 'post title', 'Article Title'),
      keyword: pickField(row, 'Keyword', 'keyword', 'Primary Keyword', 'primary keyword', 'SEO Keyword'),
      targetDate: pickField(row, 'Target Date', 'target date', 'Publish Date', 'publish date', 'Date', 'date'),
      status: pickField(row, 'Status', 'status', 'Stage', 'stage'),
      notes: pickField(row, 'Notes', 'notes', 'Brief', 'brief', 'Angle', 'angle'),
      searchVolume: pickField(row, 'Search Volume', 'search volume', 'Search Vol', 'search vol', 'Volume', 'volume'),
      searchIntent: pickField(row, 'Search Intent', 'search intent', 'Intent', 'intent'),
      cluster: pickField(row, 'Cluster', 'cluster', 'Category', 'category', 'Topic Cluster'),
      audience: pickField(row, 'Audience', 'audience', 'Target Audience', 'For'),
      kd: pickField(row, 'KD', 'kd', 'Keyword Difficulty', 'Difficulty', 'difficulty'),
      wordTarget: pickField(row, 'Word Target', 'word target', 'Word Count', 'word count', 'Length', 'length'),
      week: pickField(row, 'Week', 'week'),
    }))
    .filter((item) => item.title);

  return { items };
}
