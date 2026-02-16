const MODE_MAP = {
  gap_fix: { label: 'Gap Fix', pill: 'pill-probing' },
  socratic_probe: { label: 'Probing', pill: 'pill-probing' },
  level_up: { label: 'Level Up', pill: 'pill-mastered' },
  conflict_resolution: { label: 'Conflict', pill: 'pill-gap' },
};

export const MODE_CONFIG = MODE_MAP;

export default function SessionDashboard({ topic, confidenceBefore, currentMode, assessments, roundCount, elapsed }) {
  const mode = MODE_MAP[currentMode] || MODE_MAP.socratic_probe;

  const concepts = [];
  assessments.forEach((a) => {
    (a.what_they_nailed || []).forEach((c) => {
      if (!concepts.find((x) => x.name === c)) concepts.push({ name: c, status: 'mastered' });
    });
    if (a.key_weakness_targeted) {
      const name = a.key_weakness_targeted.slice(0, 50);
      if (!concepts.find((x) => x.name === name)) concepts.push({ name, status: 'probing' });
    }
  });

  const mins = Math.floor(elapsed / 60);
  const secs = (elapsed % 60).toString().padStart(2, '0');

  return (
    <>
      {/* Session overview */}
      <div className="paper-card p-5">
        <div className="label-caps mb-3">Session</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ background: 'var(--white-glass)', border: '1px solid var(--rule)' }}>
            <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>Mode</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${currentMode === 'level_up' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-sm font-medium">{mode.label}</span>
            </div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--white-glass)', border: '1px solid var(--rule)' }}>
            <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>Timer</div>
            <div className="mt-1 text-sm font-medium">{mins}:{secs}</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--white-glass)', border: '1px solid var(--rule)' }}>
            <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>Exchanges</div>
            <div className="mt-1 text-sm font-medium">{roundCount}</div>
          </div>
          <div className="rounded-xl p-3" style={{ background: 'var(--white-glass)', border: '1px solid var(--rule)' }}>
            <div className="text-xs" style={{ color: 'var(--ink-muted)' }}>Confidence</div>
            <div className="mt-1 text-sm font-medium">{confidenceBefore}/10</div>
          </div>
        </div>
      </div>

      {/* Concepts */}
      {concepts.length > 0 && (
        <div className="paper-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="label-caps">Concepts</span>
            <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{concepts.length} items</span>
          </div>
          <div className="space-y-2">
            {concepts.map((c, i) => (
              <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm animate-fade-in ${
                c.status === 'mastered' ? 'pill-mastered' : 'pill-probing'
              }`} style={{ border: '1px solid var(--rule)', animationDelay: `${i * 60}ms` }}>
                <span className="font-medium">{c.name}</span>
                <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current target */}
      <div className="rounded-2xl border border-dashed p-4" style={{ background: 'var(--amber-bg)', borderColor: 'var(--rule)' }}>
        <div className="label-caps mb-1">Currently targeting</div>
        <p className="text-sm leading-relaxed">
          {assessments.length > 0
            ? assessments[assessments.length - 1].key_weakness_targeted
            : 'Analyzing your explanation...'}
        </p>
      </div>
    </>
  );
}
