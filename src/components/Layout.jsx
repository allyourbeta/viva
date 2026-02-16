import useSessionStore from '../store/sessionStore';

const SUBTITLES = {
  source: 'Learn Under Pressure',
  confidence: 'Learn Under Pressure',
  recording: 'Learn Under Pressure',
  tutorial: 'Live Examination',
  card: 'Session Report',
};

// Steps that use the full-bleed dark session style
const SESSION_STEPS = ['source', 'confidence', 'recording', 'tutorial', 'card'];

export default function Layout({ children }) {
  const step = useSessionStore((s) => s.step);
  const isSession = SESSION_STEPS.includes(step);
  const subtitle = SUBTITLES[step] || 'Defense Ledger';

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
          Learn the way Turing did.
        </div>
      </header>
      <main className={isSession ? 'px-6 py-4' : 'mx-auto max-w-6xl px-8 py-6'}>
        {children}
      </main>
    </div>
  );
}
