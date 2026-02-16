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
    <div className="session-panel animate-fade-in">
      <div className="session-panel-inner">
        <div className="text-center mb-8">
          <div className="label-caps mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Choose your subject</div>
          <h2 className="serif text-3xl md:text-4xl font-bold tracking-tight" style={{ color: '#f0ecff' }}>
            What will you defend?
          </h2>
          <p className="text-base mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Name the topic, then optionally provide source material.
          </p>
        </div>

        {/* Topic input */}
        <div className="mb-6">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., React useEffect hook, database indexing, photosynthesis..."
            className="session-input"
            autoFocus
          />
        </div>

        {/* Source mode selector */}
        <div className="mb-6">
          <div className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Source material</div>
          <div className="grid grid-cols-3 gap-2">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all"
                style={{
                  borderColor: mode === m.key ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)',
                  background: mode === m.key ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.03)',
                  color: mode === m.key ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                }}
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
            className="session-input mb-6"
          />
        )}

        {mode === 'paste' && (
          <textarea
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value)}
            placeholder="Paste your notes, textbook excerpt, or any reference material..."
            rows={4}
            className="session-input mb-6 resize-none"
            style={{ minHeight: 120 }}
          />
        )}

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!canProceed || isLoading}
          className="w-full py-4 rounded-xl text-white text-lg font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
          style={{ background: 'var(--gradient-indigo)', boxShadow: 'var(--glow-indigo)' }}
        >
          {isLoading ? 'Finding sources...' : 'Begin Self-Assessment →'}
        </button>
      </div>
    </div>
  );
}
