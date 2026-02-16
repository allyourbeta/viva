/* ── Exam Sidebar Diagnostic Components ── */

/* ── Confidence Trajectory Bar Chart ── */
export function Trajectory({ assessments }) {
  const points = assessments
    .filter((a) => a.thinking?.confidence_assessment)
    .map((a, i) => ({ round: i + 1, score: a.thinking.confidence_assessment }));
  if (points.length === 0) return null;

  return (
    <div className="flex items-end gap-1.5" style={{ height: 48 }}>
      {points.map((p, i) => {
        const clr = p.score >= 7 ? 'var(--sage)' : p.score >= 5 ? 'var(--amber-accent)' : 'var(--oxblood)';
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="mono text-xs font-bold" style={{ color: clr }}>{p.score}</span>
            <div
              className="rounded transition-all duration-500"
              style={{
                width: 18,
                height: `${(p.score / 10) * 36}px`,
                background: clr,
                opacity: 0.6 + (i / points.length) * 0.4,
              }}
            />
            <span className="mono text-[8px]" style={{ color: 'var(--ink-faint)' }}>R{p.round}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Concept Board ── */
export function ConceptBoard({ assessments }) {
  const concepts = [];
  assessments.forEach((a) => {
    if (!a.thinking) return;
    (a.thinking.what_they_nailed || []).forEach((c) => {
      if (!concepts.find((x) => x.name === c)) concepts.push({ name: c, status: 'mastered' });
    });
    if (a.thinking.key_weakness_targeted) {
      const name = a.thinking.key_weakness_targeted.slice(0, 50);
      if (!concepts.find((x) => x.name === name)) concepts.push({ name, status: 'probing' });
    }
  });
  if (concepts.length === 0) return null;

  return (
    <div className="space-y-1">
      {concepts.map((c, i) => {
        const isMastered = c.status === 'mastered';
        return (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium animate-fade-in"
            style={{
              background: isMastered ? 'var(--sage-bg)' : 'var(--amber-bg)',
              animationDelay: `${i * 50}ms`,
            }}
          >
            <span className="font-bold text-sm" style={{ color: isMastered ? 'var(--sage)' : 'var(--amber-accent)', width: 14, textAlign: 'center' }}>
              {isMastered ? '✓' : '→'}
            </span>
            <span className="flex-1" style={{ color: 'var(--ink)' }}>{c.name}</span>
            <span className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: isMastered ? 'var(--sage)' : 'var(--amber-accent)' }}>
              {c.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
