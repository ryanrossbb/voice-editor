'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  AlertCircle,
  ExternalLink,
  Loader2,
  LogOut,
  Calendar,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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

function formatTargetDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const DRAFT_STATUS_STYLES = {
  draft: { label: 'Draft', color: '#8a7f6a', bg: '#ede6d3' },
  pending: { label: 'Pending Review', color: '#b85c00', bg: '#fce8d1' },
  private: { label: 'Private', color: '#5a3a8e', bg: '#e8dcf5' },
  future: { label: 'Scheduled', color: '#1e6091', bg: '#d6e9f5' },
};

const PIPELINE_STATUS_STYLES = {
  idea: { color: '#6b7b94', bg: '#dde3ec' },
  planned: { color: '#6b7b94', bg: '#dde3ec' },
  outlined: { color: '#1e6091', bg: '#d6e9f5' },
  researching: { color: '#1e6091', bg: '#d6e9f5' },
  drafting: { color: '#b85c00', bg: '#fce8d1' },
  drafted: { color: '#b85c00', bg: '#fce8d1' },
  'in review': { color: '#c0392b', bg: '#fdf0ed' },
  'ready for matt': { color: '#c0392b', bg: '#fdf0ed' },
  'ready for review': { color: '#c0392b', bg: '#fdf0ed' },
  scheduled: { color: '#3d7a3d', bg: '#dceadc' },
  published: { color: '#3d7a3d', bg: '#dceadc' },
  'on hold': { color: '#8a7f6a', bg: '#ede6d3' },
};

const AUDIENCE_STYLES = {
  'w-2': { color: '#1e6091', bg: '#d6e9f5' },
  w2: { color: '#1e6091', bg: '#d6e9f5' },
  '1099': { color: '#3d7a3d', bg: '#dceadc' },
  both: { color: '#5a3a8e', bg: '#e8dcf5' },
  tofu: { color: '#b85c00', bg: '#fce8d1' },
};

function getPipelineStatusStyle(status) {
  const key = (status || '').toLowerCase().trim();
  return PIPELINE_STATUS_STYLES[key] || { color: '#8a7f6a', bg: '#ede6d3' };
}

function getAudienceStyle(audience) {
  const key = (audience || '').toLowerCase().trim();
  return AUDIENCE_STYLES[key] || { color: '#8a7f6a', bg: '#ede6d3' };
}

export default function Dashboard() {
  const router = useRouter();
  const [drafts, setDrafts] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [draftsError, setDraftsError] = useState('');
  const [pipelineError, setPipelineError] = useState('');
  const [draftsNotConfigured, setDraftsNotConfigured] = useState(false);
  const [pipelineNotConfigured, setPipelineNotConfigured] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) setUserEmail(data.user.email);
      });
    }

    fetch('/api/wp/drafts')
      .then((r) => r.json())
      .then((data) => {
        if (data.notConfigured) {
          setDraftsNotConfigured(true);
          setDrafts([]);
        } else if (data.error) {
          setDraftsError(data.error);
        } else {
          setDrafts(data.drafts);
        }
      })
      .catch((e) => setDraftsError(e.message));

    fetch('/api/pipeline')
      .then((r) => r.json())
      .then((data) => {
        if (data.notConfigured) {
          setPipelineNotConfigured(true);
          setPipeline([]);
        } else if (data.error) {
          setPipelineError(data.error);
          setPipeline([]);
        } else {
          setPipeline(data.items);
        }
      })
      .catch((e) => {
        setPipelineError(e.message);
        setPipeline([]);
      });
  }, []);

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

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
              Matt Simon's Workspace
            </p>
          </div>
          {userEmail && (
            <div className="flex items-center gap-4 text-xs" style={{ color: '#8a7f6a' }}>
              <span className="hidden sm:inline">{userEmail}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 hover:underline uppercase"
                style={{ letterSpacing: '0.15em' }}
              >
                <LogOut size={11} /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10">

        {/* DRAFTS SECTION */}
        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-6">
            <h2
              className="display text-sm uppercase"
              style={{ color: '#8a7f6a', letterSpacing: '0.22em' }}
            >
              Needs Review
            </h2>
            {drafts && !draftsNotConfigured && drafts.length > 0 && (
              <span className="text-xs" style={{ color: '#8a7f6a' }}>
                {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
              </span>
            )}
          </div>

          {draftsError && (
            <div
              className="text-sm p-5 mb-6 flex items-start gap-3"
              style={{ background: '#fdf0ed', color: '#c0392b', border: '1px solid #f4c8c0' }}
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium mb-1">Couldn't reach WordPress</div>
                <div className="mono text-xs">{draftsError}</div>
              </div>
            </div>
          )}

          {draftsNotConfigured && (
            <div
              className="p-6 mb-4 text-sm"
              style={{ background: '#fefaf0', border: '1px solid #e9d9ad', color: '#3a3530' }}
            >
              WordPress isn't connected yet. Add{' '}
              <code className="mono text-xs">WP_SITE_URL</code>,{' '}
              <code className="mono text-xs">WP_USERNAME</code>, and{' '}
              <code className="mono text-xs">WP_APP_PASSWORD</code> to your environment.
            </div>
          )}

          {drafts === null && !draftsError && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={18} className="animate-spin" style={{ color: '#8a7f6a' }} />
            </div>
          )}

          {drafts && drafts.length === 0 && !draftsNotConfigured && !draftsError && (
            <div className="text-center py-12">
              <FileText size={28} className="mx-auto mb-3" style={{ color: '#c0b89a' }} />
              <p className="text-sm" style={{ color: '#8a7f6a' }}>
                No drafts waiting.
              </p>
            </div>
          )}

          {drafts && drafts.length > 0 && (
            <div className="space-y-4">
              {drafts.map((d) => {
                const statusStyle = DRAFT_STATUS_STYLES[d.status] || DRAFT_STATUS_STYLES.draft;
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
                      <p className="text-sm mb-4" style={{ color: '#3a3530', lineHeight: 1.6 }}>
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
        </section>

        {/* PIPELINE SECTION */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-6">
            <h2
              className="display text-sm uppercase flex items-center gap-2"
              style={{ color: '#8a7f6a', letterSpacing: '0.22em' }}
            >
              <Calendar size={12} /> Coming Up
            </h2>
            {pipeline && !pipelineNotConfigured && pipeline.length > 0 && (
              <span className="text-xs" style={{ color: '#8a7f6a' }}>
                {pipeline.length} {pipeline.length === 1 ? 'topic' : 'topics'}
              </span>
            )}
          </div>

          {pipelineError && (
            <div
              className="text-sm p-5 mb-4 flex items-start gap-3"
              style={{ background: '#fdf0ed', color: '#c0392b', border: '1px solid #f4c8c0' }}
            >
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium mb-1">Couldn't load pipeline</div>
                <div className="mono text-xs">{pipelineError}</div>
              </div>
            </div>
          )}

          {pipelineNotConfigured && (
            <div
              className="p-6 text-sm"
              style={{ background: '#fefaf0', border: '1px solid #e9d9ad', color: '#3a3530' }}
            >
              Pipeline source not connected. Add{' '}
              <code className="mono text-xs">GOOGLE_SHEET_CSV_URL</code> to your environment.
              See README for setup steps.
            </div>
          )}

          {pipeline === null && !pipelineError && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={16} className="animate-spin" style={{ color: '#8a7f6a' }} />
            </div>
          )}

          {pipeline && pipeline.length === 0 && !pipelineNotConfigured && !pipelineError && (
            <div className="text-center py-8 text-sm" style={{ color: '#8a7f6a' }}>
              No upcoming topics. Add rows to your sheet to see them here.
            </div>
          )}

          {pipeline && pipeline.length > 0 && (
            <div className="space-y-3">
              {pipeline.map((item, idx) => {
                const statusStyle = getPipelineStatusStyle(item.status);
                const audienceStyle = item.audience ? getAudienceStyle(item.audience) : null;
                return (
                  <div
                    key={idx}
                    className="bg-white soft-shadow p-5 flex items-start gap-4"
                    style={{ borderLeft: '3px solid #d6cfbe' }}
                  >
                    {item.targetDate && (
                      <div className="flex-shrink-0 text-center w-16" style={{ color: '#8a7f6a' }}>
                        <div className="mono text-xs uppercase">
                          {formatTargetDate(item.targetDate)}
                        </div>
                        {item.week && (
                          <div className="text-xs mt-0.5" style={{ color: '#b8ad94' }}>
                            Wk {item.week}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {/* Top row: cluster/audience tags + status */}
                      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.cluster && (
                            <span
                              className="text-xs px-2 py-0.5"
                              style={{
                                color: '#5a4f3a',
                                background: '#f0ead8',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {item.cluster}
                            </span>
                          )}
                          {item.audience && audienceStyle && (
                            <span
                              className="text-xs uppercase px-2 py-0.5"
                              style={{
                                color: audienceStyle.color,
                                background: audienceStyle.bg,
                                letterSpacing: '0.1em',
                              }}
                            >
                              {item.audience}
                            </span>
                          )}
                        </div>
                        {item.status && (
                          <span
                            className="text-xs uppercase whitespace-nowrap px-2 py-0.5"
                            style={{
                              color: statusStyle.color,
                              background: statusStyle.bg,
                              letterSpacing: '0.1em',
                            }}
                          >
                            {item.status}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3
                        className="display text-lg mb-2"
                        style={{
                          color: '#1a1815',
                          fontWeight: 500,
                          fontVariationSettings: '"opsz" 100',
                          lineHeight: 1.35,
                        }}
                      >
                        {item.title}
                      </h3>

                      {/* Metadata line: keyword + volume + KD + word target */}
                      {(item.keyword || item.searchVolume || item.kd || item.wordTarget || item.searchIntent) && (
                        <div
                          className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
                          style={{ color: '#8a7f6a' }}
                        >
                          {item.keyword && (
                            <span className="mono" style={{ color: '#5a4f3a' }}>
                              {item.keyword}
                            </span>
                          )}
                          {item.searchVolume && (
                            <>
                              <span>·</span>
                              <span>{item.searchVolume} vol</span>
                            </>
                          )}
                          {item.kd && (
                            <>
                              <span>·</span>
                              <span>KD {item.kd}</span>
                            </>
                          )}
                          {item.wordTarget && (
                            <>
                              <span>·</span>
                              <span>{item.wordTarget} words</span>
                            </>
                          )}
                          {item.searchIntent && (
                            <>
                              <span>·</span>
                              <span>{item.searchIntent}</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <p
                          className="text-xs mt-2 italic"
                          style={{ color: '#5a4f3a', lineHeight: 1.5 }}
                        >
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

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
