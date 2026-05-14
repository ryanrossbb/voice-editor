'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

const STATUS_STYLES = {
  draft: { label: 'Draft', color: '#8a7f6a', bg: '#ede6d3' },
  pending: { label: 'Pending Review', color: '#b85c00', bg: '#fce8d1' },
  private: { label: 'Private', color: '#5a3a8e', bg: '#e8dcf5' },
  future: { label: 'Scheduled', color: '#1e6091', bg: '#d6e9f5' },
};

export default function Dashboard() {
  const [drafts, setDrafts] = useState(null);
  const [error, setError] = useState('');
  const [notConfigured, setNotConfigured] = useState(false);
  const [reviewerName] = useState('Matt Simon');

  useEffect(() => {
    fetch('/api/wp/drafts')
      .then((r) => r.json())
      .then((data) => {
        if (data.notConfigured) {
          setNotConfigured(true);
          setDrafts([]);
        } else if (data.error) {
          setError(data.error);
        } else {
          setDrafts(data.drafts);
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen w-full">
      <header className="border-b px-8 py-6" style={{ borderColor: '#e0d8c4' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1
              className="display text-3xl tracking-tight"
              style={{ color: '#1a1815', fontWeight: 500, fontVariationSettings: '"opsz" 144' }}
            >
              Voice Editor
            </h1>
            <p
              className="text-xs uppercase mt-1"
              style={{ color: '#8a7f6a', letterSpacing: '0.22em' }}
            >
              {reviewerName}'s Drafts
            </p>
          </div>
          {drafts && !notConfigured && (
            <div className="text-xs" style={{ color: '#8a7f6a', letterSpacing: '0.15em' }}>
              <span className="uppercase">{drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">
        {error && (
          <div
            className="text-sm p-5 mb-6 flex items-start gap-3"
            style={{ background: '#fdf0ed', color: '#c0392b', border: '1px solid #f4c8c0' }}
          >
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium mb-1">Couldn't reach WordPress</div>
              <div className="mono text-xs">{error}</div>
            </div>
          </div>
        )}

        {notConfigured && (
          <div
            className="p-8 mb-6"
            style={{ background: '#fefaf0', border: '1px solid #e9d9ad' }}
          >
            <h2 className="display text-xl mb-2" style={{ color: '#1a1815' }}>
              WordPress isn't connected yet
            </h2>
            <p className="text-sm mb-4" style={{ color: '#3a3530', lineHeight: 1.6 }}>
              Add these environment variables to your Netlify deploy to pull in drafts:
            </p>
            <pre
              className="mono text-xs p-4 mb-4"
              style={{ background: '#1a1815', color: '#f6f3eb', overflow: 'auto' }}
            >
{`WP_SITE_URL=https://yoursite.com
WP_USERNAME=your-wp-username
WP_APP_PASSWORD=xxxx xxxx xxxx xxxx xxxx xxxx`}
            </pre>
            <p className="text-xs" style={{ color: '#8a7f6a' }}>
              Generate an Application Password in WordPress under{' '}
              <strong>Users → Profile → Application Passwords</strong>. See the README for details.
            </p>
          </div>
        )}

        {drafts === null && !error && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={20} className="animate-spin" style={{ color: '#8a7f6a' }} />
          </div>
        )}

        {drafts && drafts.length === 0 && !notConfigured && !error && (
          <div className="text-center py-20">
            <FileText size={32} className="mx-auto mb-3" style={{ color: '#c0b89a' }} />
            <p className="display text-lg" style={{ color: '#3a3530' }}>
              No drafts waiting
            </p>
            <p className="text-xs mt-2" style={{ color: '#8a7f6a' }}>
              New drafts in WordPress will appear here.
            </p>
          </div>
        )}

        {drafts && drafts.length > 0 && (
          <div className="space-y-4">
            {drafts.map((d) => {
              const statusStyle = STATUS_STYLES[d.status] || STATUS_STYLES.draft;
              return (
                <Link
                  key={d.id}
                  href={`/edit/${d.id}`}
                  className="block bg-white paper-shadow p-8 transition-all hover:translate-y-[-2px] hover:shadow-lg"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="flex items-baseline justify-between gap-4 mb-3">
                    <h3
                      className="display text-2xl tracking-tight"
                      style={{
                        color: '#1a1815',
                        fontWeight: 500,
                        fontVariationSettings: '"opsz" 100',
                        lineHeight: 1.25,
                      }}
                    >
                      {d.title || '(Untitled)'}
                    </h3>
                    <span
                      className="text-xs uppercase whitespace-nowrap px-2.5 py-1"
                      style={{
                        color: statusStyle.color,
                        background: statusStyle.bg,
                        letterSpacing: '0.12em',
                      }}
                    >
                      {statusStyle.label}
                    </span>
                  </div>
                  {d.excerpt && (
                    <p
                      className="text-sm mb-4"
                      style={{ color: '#3a3530', lineHeight: 1.6 }}
                    >
                      {d.excerpt}
                      {d.excerpt.length >= 160 && '…'}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs" style={{ color: '#8a7f6a' }}>
                    <span>Updated {relativeTime(d.modified)}</span>
                    <span>·</span>
                    <span>{d.wordCount} words</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12 pt-8 border-t" style={{ borderColor: '#e0d8c4' }}>
          <Link
            href="/standalone"
            className="text-xs flex items-center gap-2 hover:underline"
            style={{ color: '#8a7f6a', letterSpacing: '0.1em' }}
          >
            <ExternalLink size={12} />
            Or edit a draft that isn't in WordPress
          </Link>
        </div>
      </main>
    </div>
  );
}
