import useSessionStore from '../store/sessionStore';

const SUBTITLES = {
  source: 'Tutorial Ledger',
  confidence: 'Tutorial Ledger',
  recording: 'Tutorial Ledger',
  tutorial: 'Live Tutorial',
  card: 'Session Report',
};

export default function Layout({ children }) {
  const step = useSessionStore((s) => s.step);
  const isTutorial = step === 'tutorial';
  const subtitle = SUBTITLES[step] || 'Tutorial Ledger';

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-8 py-3 border-b"
        style={{ borderColor: 'var(--rule)' }}>
        <div className="flex items-center gap-4">
          {/* Logo mark */}
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold tracking-tight"
            style={{ background: 'var(--gradient-indigo)' }}>
            V
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="label-caps" style={{ color: 'var(--ink)' }}>
                Viva
              </span>
              <span className="serif text-lg font-semibold tracking-tight">
                {subtitle}
              </span>
            </div>
          </div>
        </div>
        <div className="text-xs font-medium tracking-wide" style={{ color: 'var(--ink-faint)' }}>
          Explain it. Defend it. Know it.
        </div>
      </header>
      <main className={`mx-auto px-8 py-6 ${isTutorial ? 'max-w-[1400px]' : 'max-w-6xl'}`}>
        {children}
      </main>
    </div>
  );
}
