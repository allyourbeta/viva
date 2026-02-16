import { useEffect, useState } from 'react';
import { Mic } from 'lucide-react';
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

export default function SessionHistory({ onNewSession }) {
  const sessions = useSessionStore((s) => s.sessions);
  const setSessions = useSessionStore((s) => s.setSessions);
  const [topicInput, setTopicInput] = useState('');

  useEffect(() => {
    loadSessions().then((real) => setSessions(mergeWithDemoSessions(real)));
  }, [setSessions]);

  const handleStart = () => {
    if (topicInput.trim()) {
      useSessionStore.getState().setTopic(topicInput.trim());
      useSessionStore.getState().setStep('confidence');
    }
    onNewSession();
  };

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: New session */}
        <section className="col-span-12 md:col-span-5 paper-card p-6 flex flex-col gap-4">
          <div>
            <div className="label-caps">New tutorial</div>
            <h2 className="mt-1 serif text-2xl font-semibold tracking-tight">
              What will you explain today?
            </h2>
          </div>

          <label className="block">
            <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>Topic</span>
            <div className="mt-1 rounded-xl border px-4 py-3 flex items-center justify-between"
              style={{ borderColor: 'var(--rule)', background: 'var(--panel)' }}>
              <input
                className="bg-transparent outline-none text-sm flex-1"
                placeholder="e.g. Backpropagation, Nash equilibrium..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              />
              <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>Enter to begin</span>
            </div>
          </label>

          <button onClick={handleStart}
            className="w-full rounded-xl px-4 py-3 text-white text-sm font-medium flex items-center justify-center gap-2"
            style={{ background: 'var(--indigo)' }}>
            <Mic className="w-4 h-4" /> Start viva
          </button>

          <div className="rounded-xl p-4" style={{ background: 'var(--white-glass)', border: '1px solid var(--rule)' }}>
            <div className="label-caps">How it works</div>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              You speak. The supervisor probes. You earn mastery by explaining precisely — just like an Oxbridge viva voce.
            </p>
          </div>
        </section>

        {/* RIGHT: History */}
        <section className="col-span-12 md:col-span-7">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="serif text-2xl tracking-tight">Session history</h2>
            <span className="label-caps">{sessions.length} sessions</span>
          </div>

          <div className="paper-card divide-y" style={{ borderColor: 'var(--rule)' }}>
            {sessions.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--ink-muted)' }}>
                <p className="serif text-lg">No tutorials yet.</p>
                <p className="text-sm mt-1">Start your first viva above.</p>
              </div>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="p-5 hover:bg-white/50 transition-colors" style={{ borderColor: 'var(--rule-light)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="serif text-lg font-medium">{s.topic}</span>
                        {s.routing_mode && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${MODE_PILLS[s.routing_mode] || ''}`}
                            style={{ borderColor: 'var(--rule)' }}>
                            {MODE_LABELS[s.routing_mode] || s.routing_mode}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>
                        {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {s.confidence_after != null && ` · Confidence ${s.confidence_before} → ${s.confidence_after}`}
                      </div>
                    </div>
                  </div>
                  {s.one_thing_to_remember && (
                    <div className="mt-2 text-sm">
                      <span style={{ color: 'var(--ink-muted)' }}>Remember: </span>
                      <span className="serif italic">{s.one_thing_to_remember}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
