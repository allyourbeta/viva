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
      <header className="flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: 'var(--rule)' }}>
        <div className="flex items-baseline gap-3">
          <div>
            <div className="label-caps">Viva</div>
            <span className="serif text-lg font-semibold tracking-tight">
              {subtitle}
            </span>
          </div>
        </div>
        <div className="text-xs" style={{ color: 'var(--ink-faint)' }}>
          Explain it. Defend it. Know it.
        </div>
      </header>
      <main className={`mx-auto px-8 py-6 ${isTutorial ? 'max-w-[1400px]' : 'max-w-6xl'}`}>
        {children}
      </main>
    </div>
  );
}
