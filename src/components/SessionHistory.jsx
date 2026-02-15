import { useEffect } from 'react';
import { Plus, BookOpen, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { loadSessions } from '../api/supabase';

function ConfidenceBadge({ before, after }) {
  if (after == null) return null;
  const diff = after - before;
  const color = diff > 0 ? 'text-emerald-600 bg-emerald-50' : diff < 0 ? 'text-amber-600 bg-amber-50' : 'text-warm-500 bg-warm-100';
  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      <Icon className="w-3 h-3" />
      {before} → {after}
    </span>
  );
}

function ModeTag({ mode }) {
  const labels = {
    gap_fix: 'Gap Fix',
    socratic_probe: 'Socratic',
    level_up: 'Level Up',
    conflict_resolution: 'Conflict',
  };
  const colors = {
    gap_fix: 'bg-red-50 text-red-700',
    socratic_probe: 'bg-primary-50 text-primary-700',
    level_up: 'bg-emerald-50 text-emerald-700',
    conflict_resolution: 'bg-amber-50 text-amber-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[mode] || 'bg-warm-100 text-warm-600'}`}>
      {labels[mode] || mode}
    </span>
  );
}

export default function SessionHistory({ onNewSession }) {
  const sessions = useSessionStore((s) => s.sessions);
  const setSessions = useSessionStore((s) => s.setSessions);

  useEffect(() => {
    loadSessions().then(setSessions);
  }, [setSessions]);

  return (
    <div className="animate-fade-in">
      {/* Hero / CTA */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-serif font-bold text-warm-900 mb-2">
          Your Tutorial Sessions
        </h2>
        <p className="text-warm-500 text-sm max-w-md mx-auto leading-relaxed">
          Explain what you're learning. Your AI supervisor will find the cracks in your thinking — just like an Oxbridge <em>viva voce</em>.
        </p>
        <button
          onClick={onNewSession}
          className="mt-6 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm shadow-primary-600/20"
        >
          <Plus className="w-4 h-4" />
          New Session
        </button>
      </div>

      {/* Session list */}
      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-10 h-10 text-warm-300 mx-auto mb-3" />
          <p className="text-warm-400 text-sm">
            No sessions yet. Start your first tutorial above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-2">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </p>
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl border border-warm-200 p-4 hover:border-primary-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-warm-900 truncate">{s.topic}</h3>
                  <p className="text-xs text-warm-400 mt-0.5">
                    {new Date(s.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.routing_mode && <ModeTag mode={s.routing_mode} />}
                  <ConfidenceBadge before={s.confidence_before} after={s.confidence_after} />
                </div>
              </div>
              {s.one_thing_to_remember && (
                <p className="text-sm text-warm-600 mt-2 italic leading-relaxed">
                  💡 {s.one_thing_to_remember}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
