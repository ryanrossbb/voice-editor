'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  RotateCcw,
  Check,
  X,
  Loader2,
  FileText,
  Sparkles,
  Link as LinkIcon,
  Copy,
} from 'lucide-react';

const SAMPLE_DRAFT = `Why Every NJ Advisor Should Be Talking About Long-Term Care

The conversation around long-term care has shifted. Five years ago, advisors could get away with a single slide in a retirement plan presentation — a polite mention of "potential care costs" before moving on to allocation models.

That's no longer enough. New Jersey ranks among the most expensive states in the country for long-term care, and the gap between what families expect to pay and what they actually will is widening every year. Clients are reading about it. They're seeing it happen to their parents. And if you're not bringing it up, someone else will.

Here's what every advisor should be addressing in 2026: the funding question, the venue question, and the family question. Each one carries weight, and each one is easier to discuss before a crisis than after.`;

// URL-safe base64 encoding that handles unicode correctly
const encodeText = (s) => {
  if (typeof window === 'undefined') return '';
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const decodeText = (s) => {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
};

export default function VoiceBlogEditor() {
  const [draft, setDraft] = useState('');
  const [revised, setRevised] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [reviewerName, setReviewerName] = useState('Matt Simon');
  const [shareConfirmation, setShareConfirmation] = useState('');
  const [copyConfirmation, setCopyConfirmation] = useState('');
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Load URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    const name = params.get('name');
    if (d) {
      const decoded = decodeText(d);
      if (decoded) setDraft(decoded);
    }
    if (name) setReviewerName(name);
  }, []);

  const startRecording = () => {
    setError('');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition not supported. Try Chrome, Edge, or Safari.');
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    finalTranscriptRef.current = transcript ? transcript.trimEnd() + ' ' : '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += text + ' ';
        } else {
          interim += text;
        }
      }
      setTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return;
      setError(`Recording error: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
  };

  const applyFeedback = async () => {
    if (!draft.trim() || !transcript.trim()) return;
    setIsProcessing(true);
    setError('');
    try {
      const response = await fetch('/api/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft,
          transcript,
          reviewerName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server returned ${response.status}`);
      }

      setRevised(data.revised);
    } catch (e) {
      setError('Failed to apply feedback: ' + e.message);
    }
    setIsProcessing(false);
  };

  const acceptRevision = () => {
    setDraft(revised);
    setRevised('');
    setTranscript('');
    finalTranscriptRef.current = '';
  };

  const rejectRevision = () => setRevised('');

  const clearTranscript = () => {
    setTranscript('');
    finalTranscriptRef.current = '';
  };

  const loadSample = () => setDraft(SAMPLE_DRAFT);

  const copyShareLink = async () => {
    if (!draft.trim()) return;
    const encoded = encodeText(draft);
    const url = `${window.location.origin}${window.location.pathname}?d=${encoded}&name=${encodeURIComponent(reviewerName)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareConfirmation('Link copied');
      setTimeout(() => setShareConfirmation(''), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setCopyConfirmation('Copied');
      setTimeout(() => setCopyConfirmation(''), 2000);
    } catch {
      setError('Could not copy to clipboard');
    }
  };

  const hasContent = draft.trim().length > 0;
  const hasTranscript = transcript.trim().length > 0;
  const wordCount = draft.split(/\s+/).filter(Boolean).length;

  return (
    <div className="min-h-screen w-full">
      <header
        className="border-b px-8 py-6"
        style={{ borderColor: '#e0d8c4' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1
              className="display text-3xl tracking-tight"
              style={{ color: '#1a1815', fontWeight: 500, fontVariationSettings: '"opsz" 144' }}
            >
              MedTech Financial
            </h1>
            <p
              className="text-xs uppercase mt-1"
              style={{ color: '#8a7f6a', letterSpacing: '0.22em' }}
            >
              For {reviewerName}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={isRecording ? 'blink' : ''}
              style={{ color: isRecording ? '#c0392b' : '#8a7f6a', fontSize: '10px' }}
            >
              ●
            </span>
            <span className="uppercase" style={{ color: '#8a7f6a', letterSpacing: '0.15em' }}>
              {isRecording
                ? 'Recording'
                : isProcessing
                ? 'Processing'
                : revised
                ? 'Review'
                : 'Ready'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
        <section className="lg:col-span-3">
          <div className="flex items-baseline justify-between mb-3">
            <h2
              className="text-xs uppercase"
              style={{ color: '#8a7f6a', letterSpacing: '0.22em' }}
            >
              {revised ? 'Original Draft' : 'The Draft'}
            </h2>
            <div className="flex items-center gap-4 text-xs">
              {!hasContent && !revised && (
                <button
                  onClick={loadSample}
                  className="hover:underline"
                  style={{ color: '#c0392b' }}
                >
                  Load sample
                </button>
              )}
              {hasContent && !revised && (
                <>
                  <span style={{ color: '#8a7f6a' }}>{wordCount} words</span>
                  <button
                    onClick={copyDraft}
                    className="flex items-center gap-1 hover:underline"
                    style={{ color: '#8a7f6a' }}
                  >
                    <Copy size={11} />
                    {copyConfirmation || 'Copy draft'}
                  </button>
                  <button
                    onClick={copyShareLink}
                    className="flex items-center gap-1 hover:underline"
                    style={{ color: '#c0392b' }}
                  >
                    <LinkIcon size={11} />
                    {shareConfirmation || 'Get link'}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="bg-white paper-shadow" style={{ minHeight: '620px' }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              readOnly={!!revised}
              placeholder="Paste the blog post draft here, or click 'Load sample' to try it out…"
              className="w-full p-12 display resize-none focus:outline-none bg-transparent block"
              style={{
                minHeight: '620px',
                color: '#1a1815',
                fontSize: '17px',
                lineHeight: '1.75',
                fontVariationSettings: '"opsz" 14',
              }}
            />
          </div>
        </section>

        <section className="lg:col-span-2 flex flex-col gap-6">
          {revised ? (
            <>
              <div>
                <h2
                  className="text-xs uppercase mb-3 flex items-center gap-2"
                  style={{ color: '#c0392b', letterSpacing: '0.22em' }}
                >
                  <Sparkles size={12} /> Proposed Revision
                </h2>
                <div
                  className="bg-white p-8 paper-shadow"
                  style={{ maxHeight: '520px', overflowY: 'auto' }}
                >
                  <div
                    className="display whitespace-pre-wrap"
                    style={{ color: '#1a1815', fontSize: '15px', lineHeight: '1.75' }}
                  >
                    {revised}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={acceptRevision}
                  className="flex-1 py-4 px-6 text-xs uppercase flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: '#1a1815', color: '#f6f3eb', letterSpacing: '0.15em' }}
                >
                  <Check size={14} /> Accept
                </button>
                <button
                  onClick={rejectRevision}
                  className="flex-1 py-4 px-6 text-xs uppercase flex items-center justify-center gap-2 transition-all hover:bg-stone-100"
                  style={{ border: '1px solid #1a1815', color: '#1a1815', letterSpacing: '0.15em' }}
                >
                  <X size={14} /> Discard
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2
                  className="text-xs uppercase mb-3"
                  style={{ color: '#8a7f6a', letterSpacing: '0.22em' }}
                >
                  Feedback
                </h2>
                <div className="bg-white p-10 soft-shadow flex flex-col items-center">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!hasContent || isProcessing}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                      isRecording ? 'recording-pulse' : ''
                    } ${
                      !hasContent || isProcessing
                        ? 'opacity-30 cursor-not-allowed'
                        : 'cursor-pointer hover:scale-105'
                    }`}
                    style={{ background: isRecording ? '#c0392b' : '#1a1815', color: '#f6f3eb' }}
                  >
                    {isRecording ? (
                      <Square size={26} fill="currentColor" />
                    ) : (
                      <Mic size={30} />
                    )}
                  </button>
                  <p
                    className="text-xs uppercase mt-5"
                    style={{ color: '#8a7f6a', letterSpacing: '0.18em' }}
                  >
                    {!hasContent
                      ? 'Paste a draft first'
                      : isRecording
                      ? 'Tap to stop'
                      : 'Tap to record'}
                  </p>
                  {isRecording && (
                    <p className="text-xs mt-2 italic" style={{ color: '#c0392b' }}>
                      Listening…
                    </p>
                  )}
                </div>
              </div>

              {hasTranscript && (
                <div>
                  <div className="flex items-baseline justify-between mb-3">
                    <h3
                      className="text-xs uppercase"
                      style={{ color: '#8a7f6a', letterSpacing: '0.18em' }}
                    >
                      Transcript
                    </h3>
                    <button
                      onClick={clearTranscript}
                      className="text-xs flex items-center gap-1 hover:underline"
                      style={{ color: '#8a7f6a' }}
                    >
                      <RotateCcw size={10} /> Clear
                    </button>
                  </div>
                  <div
                    className="bg-white p-5 soft-shadow"
                    style={{ maxHeight: '180px', overflowY: 'auto' }}
                  >
                    <p
                      className="mono text-sm"
                      style={{ color: '#3a3530', lineHeight: '1.65' }}
                    >
                      {transcript}
                    </p>
                  </div>
                </div>
              )}

              {hasTranscript && !isRecording && (
                <button
                  onClick={applyFeedback}
                  disabled={isProcessing}
                  className="py-4 px-6 text-xs uppercase flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#c0392b', color: '#f6f3eb', letterSpacing: '0.15em' }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Revising
                    </>
                  ) : (
                    <>
                      <FileText size={14} /> Apply {reviewerName.split(' ')[0]}'s Feedback
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {error && (
            <div
              className="text-sm p-4"
              style={{ background: '#fdf0ed', color: '#c0392b', border: '1px solid #f4c8c0' }}
            >
              {error}
            </div>
          )}
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-8 pb-8 pt-2">
        <p className="text-xs text-center" style={{ color: '#a89d87' }}>
          Voice recording uses your browser's built-in speech recognition. Works best in Chrome,
          Edge, and Safari.
        </p>
      </footer>
    </div>
  );
}
