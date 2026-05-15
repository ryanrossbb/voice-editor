'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mic,
  Square,
  RotateCcw,
  Check,
  X,
  Loader2,
  FileText,
  Sparkles,
  ArrowLeft,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function EditPost() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id;

  const [post, setPost] = useState(null);
  const [draft, setDraft] = useState('');
  const [title, setTitle] = useState('');
  const [revised, setRevised] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const reviewerName = 'Matt Simon';

  // Load post from WordPress
  useEffect(() => {
    fetch(`/api/wp/post/${postId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPost(data);
          setDraft(data.content);
          setTitle(data.title);
        }
      })
      .catch((e) => setError(e.message));
  }, [postId]);

  // Track dirty state
  useEffect(() => {
    if (!post) return;
    setIsDirty(draft !== post.content || title !== post.title);
  }, [draft, title, post]);

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
          contentFormat: 'markdown',
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

  const saveToWordPress = async () => {
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/wp/save/${postId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft, title }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server returned ${response.status}`);
      }
      setSavedAt(new Date());
      setPost({ ...post, content: draft, title, modified: data.modified });
      setIsDirty(false);
    } catch (e) {
      setError('Failed to save: ' + e.message);
    }
    setIsSaving(false);
  };

  const hasContent = draft.trim().length > 0;
  const hasTranscript = transcript.trim().length > 0;
  const wordCount = draft.split(/\s+/).filter(Boolean).length;

  if (!post && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: '#8a7f6a' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      {/* Top bar */}
      <header className="border-b px-8 py-4 sticky top-0 z-10" style={{ borderColor: '#e0d8c4', background: '#f6f3eb' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs uppercase hover:underline"
            style={{ color: '#8a7f6a', letterSpacing: '0.15em' }}
          >
            <ArrowLeft size={14} /> Drafts
          </Link>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="display flex-1 bg-transparent focus:outline-none text-center"
            style={{
              color: '#1a1815',
              fontSize: '18px',
              fontWeight: 500,
              fontVariationSettings: '"opsz" 100',
            }}
            placeholder="Untitled"
          />

          <div className="flex items-center gap-3">
            {savedAt && !isDirty && (
              <span className="text-xs flex items-center gap-1.5" style={{ color: '#5a8a3a' }}>
                <CheckCircle2 size={12} /> Saved
              </span>
            )}
            {isDirty && !isSaving && (
              <span className="text-xs" style={{ color: '#b85c00' }}>Unsaved</span>
            )}
            <button
              onClick={saveToWordPress}
              disabled={!isDirty || isSaving}
              className="py-2 px-5 text-xs uppercase flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: '#1a1815', color: '#f6f3eb', letterSpacing: '0.12em' }}
            >
              {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {isSaving ? 'Saving' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-5 gap-8">
        <section className="lg:col-span-3">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-xs uppercase" style={{ color: '#8a7f6a', letterSpacing: '0.22em' }}>
              {revised ? 'Original Draft' : 'The Draft'}
            </h2>
            <span className="text-xs" style={{ color: '#8a7f6a' }}>{wordCount} words</span>
          </div>
          <div className="bg-white paper-shadow" style={{ minHeight: '620px' }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              readOnly={!!revised}
              className="w-full p-12 display resize-none focus:outline-none bg-transparent block mono-numerals"
              style={{
                minHeight: '620px',
                color: '#1a1815',
                fontSize: '16px',
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
                <h2 className="text-xs uppercase mb-3 flex items-center gap-2" style={{ color: '#c0392b', letterSpacing: '0.22em' }}>
                  <Sparkles size={12} /> Proposed Revision
                </h2>
                <div className="bg-white p-8 paper-shadow" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                  <div className="display whitespace-pre-wrap" style={{ color: '#1a1815', fontSize: '15px', lineHeight: '1.75' }}>
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
                <h2 className="text-xs uppercase mb-3" style={{ color: '#8a7f6a', letterSpacing: '0.22em' }}>
                  Feedback
                </h2>
                <div className="bg-white p-10 soft-shadow flex flex-col items-center">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!hasContent || isProcessing}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'recording-pulse' : ''} ${!hasContent || isProcessing ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    style={{ background: isRecording ? '#c0392b' : '#1a1815', color: '#f6f3eb' }}
                  >
                    {isRecording ? <Square size={26} fill="currentColor" /> : <Mic size={30} />}
                  </button>
                  <p className="text-xs uppercase mt-5" style={{ color: '#8a7f6a', letterSpacing: '0.18em' }}>
                    {isRecording ? 'Tap to stop' : 'Tap to record'}
                  </p>
                  {isRecording && (
                    <p className="text-xs mt-2 italic" style={{ color: '#c0392b' }}>Listening…</p>
                  )}
                </div>
              </div>

              {hasTranscript && (
                <div>
                  <div className="flex items-baseline justify-between mb-3">
                    <h3 className="text-xs uppercase" style={{ color: '#8a7f6a', letterSpacing: '0.18em' }}>Transcript</h3>
                    <button onClick={clearTranscript} className="text-xs flex items-center gap-1 hover:underline" style={{ color: '#8a7f6a' }}>
                      <RotateCcw size={10} /> Clear
                    </button>
                  </div>
                  <div className="bg-white p-5 soft-shadow" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    <p className="mono text-sm" style={{ color: '#3a3530', lineHeight: '1.65' }}>{transcript}</p>
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
                    <><Loader2 size={14} className="animate-spin" /> Revising</>
                  ) : (
                    <><FileText size={14} /> Apply {reviewerName.split(' ')[0]}'s Feedback</>
                  )}
                </button>
              )}
            </>
          )}

          {error && (
            <div className="text-sm p-4" style={{ background: '#fdf0ed', color: '#c0392b', border: '1px solid #f4c8c0' }}>
              {error}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
