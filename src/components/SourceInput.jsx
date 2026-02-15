import { useState } from 'react';
import { Globe, FileText, Sparkles } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { searchForSource } from '../api/claude';

export default function SourceInput() {
  const topic = useSessionStore((s) => s.topic);
  const setTopic = useSessionStore((s) => s.setTopic);
  const setSourceUrl = useSessionStore((s) => s.setSourceUrl);
  const setSourceText = useSessionStore((s) => s.setSourceText);
  const setSourceWasAutoSearched = useSessionStore((s) => s.setSourceWasAutoSearched);
  const setStep = useSessionStore((s) => s.setStep);
  const setIsLoading = useSessionStore((s) => s.setIsLoading);
  const setError = useSessionStore((s) => s.setError);
  const isLoading = useSessionStore((s) => s.isLoading);

  const [mode, setMode] = useState('topic'); // 'topic' | 'url' | 'paste'
  const [urlInput, setUrlInput] = useState('');
  const [pasteInput, setPasteInput] = useState('');

  const canProceed = topic.trim().length > 0;

  const handleNext = async () => {
    if (!canProceed) return;

    if (mode === 'paste' && pasteInput.trim()) {
      setSourceText(pasteInput.trim());
      setStep('confidence');
    } else if (mode === 'url' && urlInput.trim()) {
      setSourceUrl(urlInput.trim());
      // We'll fetch the URL content later during analysis via Claude's web search
      setSourceText(`Source URL: ${urlInput.trim()}`);
      setStep('confidence');
    } else {
      // Topic-only: skip source search, proceed immediately.
      // The analysis step will use Claude's knowledge directly.
      setSourceText('');
      setSourceWasAutoSearched(true);
      setStep('confidence');
    }
  };

  const modes = [
    { key: 'topic', label: 'Just a topic', icon: Sparkles, desc: 'AI uses its knowledge' },
    { key: 'url', label: 'URL', icon: Globe, desc: 'Article or docs' },
    { key: 'paste', label: 'Paste text', icon: FileText, desc: 'Notes or excerpt' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-serif font-bold text-warm-900 mb-1">
          What are you learning?
        </h2>
        <p className="text-sm text-warm-500">
          Name the topic, then optionally provide source material for your supervisor to evaluate against.
        </p>
      </div>

      {/* Topic input */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1.5">Topic</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., React useEffect hook, database indexing, photosynthesis..."
          className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors"
          autoFocus
        />
      </div>

      {/* Source mode selector */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-2">Source material</label>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${
                mode === m.key
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-warm-200 bg-white text-warm-500 hover:border-warm-300'
              }`}
            >
              <m.icon className="w-4 h-4" />
              <span className="text-xs font-medium">{m.label}</span>
              <span className="text-[10px] opacity-60">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conditional input based on mode */}
      {mode === 'url' && (
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://react.dev/reference/react/useEffect"
          className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors"
        />
      )}

      {mode === 'paste' && (
        <textarea
          value={pasteInput}
          onChange={(e) => setPasteInput(e.target.value)}
          placeholder="Paste your notes, textbook excerpt, or any reference material..."
          rows={5}
          className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors resize-none"
        />
      )}

      {/* Next button */}
      <button
        onClick={handleNext}
        disabled={!canProceed || isLoading}
        className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-warm-200 disabled:text-warm-400 text-white font-semibold transition-colors"
      >
        {isLoading ? 'Finding sources...' : 'Next — Self-Assessment'}
      </button>
    </div>
  );
}
