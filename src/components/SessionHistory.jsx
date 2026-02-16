import { useEffect, useState } from 'react';
import { Mic, TrendingUp, TrendingDown, Minus, BookOpen, Target, Brain, ArrowRight, Zap } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { loadSessions } from '../api/supabase';
import { mergeWithDemoSessions } from '../services/demoData';

const MODE_PILLS = {
  gap_fix: 'badge-gap',
  socratic_probe: 'badge-probe',
  level_up: 'badge-level',
  conflict_resolution: 'badge-conflict',
};
const MODE_LABELS = {
  gap_fix: 'Gap Fix', socratic_probe: 'Probing',
  level_up: 'Level Up', conflict_resolution: 'Conflict',
};

/* ── Learning Patterns (computed from sessions) ── */
function computePatterns(sessions) {
  if (sessions.length === 0) return null;
  const deltas = sessions
    .filter((s) => s.confidence_after != null && s.confidence_before != null)
    .map((s) => s.confidence_after - s.confidence_before);
  const avgDelta = deltas.length > 0
    ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
  const totalMastered = sessions.reduce(
    (sum, s) => sum + (s.concepts_mastered?.length || s.learning_card?.concepts_mastered?.length || 0), 0
  );
  const totalGaps = sessions.reduce(
    (sum, s) => sum + (s.remaining_gaps?.length || s.learning_card?.remaining_gaps?.length || 0), 0
  );
  const recentInsight = sessions.find(
    (s) => s.meta_learning_insight || s.learning_card?.meta_learning_insight
  );
  const insight = recentInsight?.meta_learning_insight
    || recentInsight?.learning_card?.meta_learning_insight || null;
  return { avgDelta: Math.round(avgDelta * 10) / 10, totalMastered, totalGaps, insight, count: sessions.length };
}

/* ── Session card in the ledger ── */
function SessionEntry({ session, index }) {
  const s = session;
  const delta = s.confidence_after != null ? s.confidence_after - (s.confidence_before || 0) : null;
  const remember = s.one_thing_to_remember || s.learning_card?.one_thing_to_remember;
  const nextSeed = s.next_session_seed || s.learning_card?.next_session_seed;

  return (
    <div className={`p-5 hover:bg-white/50 transition-colors animate-stagger-${Math.min(index + 1, 4)}`}
      style={{ borderColor: 'var(--rule-light)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="serif text-lg font-medium">{s.topic}</span>
            {s.routing_mode && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${MODE_PILLS[s.routing_mode] || ''}`}
                style={{ borderColor: 'var(--rule)' }}>
                {MODE_LABELS[s.routing_mode] || s.routing_mode}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
            {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
        {delta != null && (
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
            delta > 0 ? 'pill-mastered' : delta < 0 ? 'pill-gap' : ''
          }`} style={delta === 0 ? { background: 'var(--white-glass)', color: 'var(--ink-muted)' } : {}}>
            {delta > 0 ? <TrendingUp className="w-3.5 h-3.5" />
              : delta < 0 ? <TrendingDown className="w-3.5 h-3.5" />
              : <Minus className="w-3.5 h-3.5" />}
            {delta > 0 ? `+${delta}` : delta}
          </div>
        )}
      </div>
      {remember && (
        <div className="mt-3 rounded-xl p-4" style={{ background: 'var(--amber-bg)', border: '1px solid var(--rule-light)' }}>
          <p className="serif text-base italic leading-relaxed" style={{ color: 'var(--ink)' }}>
            &ldquo;{remember}&rdquo;
          </p>
        </div>
      )}
      {nextSeed && (
        <div className="mt-2 flex items-start gap-2 text-xs" style={{ color: 'var(--ink-muted)' }}>
          <Target className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>Next: {nextSeed}</span>
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
export default function SessionHistory({ onNewSession }) {
  const sessions = useSessionStore((s) => s.sessions);
  const setSessions = useSessionStore((s) => s.setSessions);
  const [topicInput, setTopicInput] = useState('');

  useEffect(() => {
    loadSessions().then((real) => setSessions(mergeWithDemoSessions(real)));
  }, [setSessions]);

  const patterns = computePatterns(sessions);

  const handleStart = () => {
    const topic = topicInput.trim();
    onNewSession();
    if (topic) {
      useSessionStore.getState().setTopic(topic);
      useSessionStore.getState().setStep('confidence');
    }
  };

  const isFirstTime = sessions.length === 0;

  return (
    <div className="animate-fade-in">
      {/* ══ HERO BANNER ══ */}
      <div className="hero-gradient rounded-2xl p-8 mb-8 animate-scale-in">
        <div className="relative z-10 flex items-start justify-between gap-8">
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest opacity-60 mb-2 font-medium">
              Voice-First Learning
            </div>
            <h1 className="serif text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-3">
              Can you explain it<br />under pressure?
            </h1>
            <p className="text-base opacity-80 leading-relaxed" style={{ maxWidth: '28rem' }}>
              Say what you know. Get challenged by an AI supervisor.
              Find out what you actually understand.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-center gap-3 pt-4">
            <div className="flex items-center gap-2">
              {['Explain', 'Defend', 'Know'].map((word, i) => (
                <span key={word}
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full animate-stagger-${i + 1}`}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(4px)',
                  }}>
                  {word}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* ══════ LEFT PANEL ══════ */}
        <section className="col-span-12 md:col-span-5 flex flex-col gap-5">
          <div className="paper-card-elevated p-6 flex flex-col gap-4">
            <div>
              <div className="label-caps">New tutorial</div>
              <h2 className="mt-1 serif text-2xl font-semibold tracking-tight">
                What will you explain today?
              </h2>
            </div>
            <label className="block">
              <span className="text-xs font-medium" style={{ color: 'var(--ink-muted)' }}>Topic</span>
              <div className="mt-1 rounded-xl border px-4 py-3 flex items-center justify-between transition-all focus-within:shadow-[0_0_0_2px_var(--indigo)]"
                style={{ borderColor: 'var(--rule)', background: 'var(--panel)' }}>
                <input className="bg-transparent outline-none text-sm flex-1"
                  placeholder="e.g. Backpropagation, Nash equilibrium..."
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()} />
              </div>
            </label>
            <button onClick={handleStart}
              className="w-full rounded-xl px-4 py-3.5 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'var(--gradient-indigo)', boxShadow: 'var(--glow-indigo)' }}>
              <Mic className="w-4 h-4" /> Start viva
            </button>
          </div>

          {/* How it works */}
          {isFirstTime && (
            <div className="paper-card p-6 animate-stagger-2">
              <div className="label-caps mb-3">How this works</div>
              <div className="space-y-4">
                {[
                  { num: '1', bg: 'var(--indigo-bg)', color: 'var(--indigo)', title: 'You explain a concept out loud', desc: '60 seconds. No notes. Just what you actually know.' },
                  { num: '2', bg: 'var(--amber-bg)', color: 'var(--amber-accent)', title: 'A supervisor finds the gaps', desc: 'Targeted questions expose what you think vs. what you actually know.' },
                  { num: '3', bg: 'var(--sage-bg)', color: 'var(--sage)', title: 'You leave knowing what to study next', desc: 'Report card with mastered concepts, remaining gaps, and one sentence to remember.' },
                ].map((step) => (
                  <div key={step.num} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: step.bg, color: step.color }}>{step.num}</div>
                    <div>
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>{step.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-2 rounded-xl p-3 text-center"
                  style={{ background: 'var(--white-glass)', border: '1px solid var(--rule)' }}>
                  <p className="serif text-sm italic" style={{ color: 'var(--ink-muted)' }}>
                    Based on the Oxbridge viva voce — the gold standard for testing understanding.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Returning user pitch */}
          {!isFirstTime && (
            <div className="paper-card p-6 animate-stagger-2">
              <div className="label-caps mb-2">The viva method</div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                Explain a concept. Get challenged. Find out what you actually know.
                Each session builds on the last.
              </p>
            </div>
          )}

          {/* Learning patterns — only with 2+ sessions */}
          {patterns && patterns.count >= 2 && (
            <div className="paper-card p-6 animate-stagger-3">
              <div className="label-caps mb-3">Your learning patterns</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="stat-reveal p-3 pt-5 text-center">
                  <div className="serif text-2xl font-bold" style={{ color: 'var(--sage)' }}>
                    {patterns.totalMastered}
                  </div>
                  <div className="text-xs mt-1 font-medium" style={{ color: 'var(--ink-muted)' }}>mastered</div>
                </div>
                <div className="stat-reveal p-3 pt-5 text-center">
                  <div className="serif text-2xl font-bold" style={{ color: 'var(--amber-accent)' }}>
                    {patterns.totalGaps}
                  </div>
                  <div className="text-xs mt-1 font-medium" style={{ color: 'var(--ink-muted)' }}>open gaps</div>
                </div>
                <div className="stat-reveal p-3 pt-5 text-center">
                  <div className="serif text-2xl font-bold"
                    style={{ color: patterns.avgDelta >= 0 ? 'var(--sage)' : 'var(--oxblood)' }}>
                    {patterns.avgDelta >= 0 ? '+' : ''}{patterns.avgDelta}
                  </div>
                  <div className="text-xs mt-1 font-medium" style={{ color: 'var(--ink-muted)' }}>avg shift</div>
                </div>
              </div>
              {patterns.insight && (
                <div className="mt-3 rounded-xl p-3"
                  style={{ background: 'var(--amber-bg)', border: '1px solid var(--rule-light)' }}>
                  <div className="flex items-start gap-2">
                    <Brain className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--amber-accent)' }} />
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                      {patterns.insight}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ══════ RIGHT PANEL ══════ */}
        <section className="col-span-12 md:col-span-7">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="serif text-2xl tracking-tight">Session history</h2>
            <span className="label-caps">{sessions.length} sessions</span>
          </div>
          <div className="paper-card divide-y" style={{ borderColor: 'var(--rule)' }}>
            {sessions.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--ink-muted)' }}>
                <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="serif text-lg">No tutorials yet.</p>
                <p className="text-sm mt-1">Start your first viva — it takes 5 minutes.</p>
              </div>
            ) : (
              sessions.map((s, i) => (
                <SessionEntry key={s.id} session={s} index={i} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
