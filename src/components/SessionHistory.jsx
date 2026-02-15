import { useEffect, useState } from 'react';
import { GraduationCap, ArrowRight, BookOpen, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { loadSessions } from '../api/supabase';
import { mergeWithDemoSessions } from '../services/demoData';

const MODE_COLORS = {
  gap_fix: 'border-l-red-400',
  socratic_probe: 'border-l-amber-400',
  level_up: 'border-l-emerald-400',
  conflict_resolution: 'border-l-purple-400',
};

const MODE_LABELS = {
  gap_fix: 'Gap Fix',
  socratic_probe: 'Socratic',
  level_up: 'Level Up',
  conflict_resolution: 'Conflict',
};

function ConfidenceDelta({ before, after }) {
  if (after == null) return null;
  const diff = after - before;
  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      <span className="text-warm-400">{before}</span>
      <span className="text-warm-300">→</span>
      <span className={diff > 0 ? 'text-emerald-600 font-bold' : diff < 0 ? 'text-amber-600 font-bold' : 'text-warm-500'}>
        {after}
      </span>
    </div>
  );
}

export default function SessionHistory({ onNewSession }) {
  const sessions = useSessionStore((s) => s.sessions);
  const setSessions = useSessionStore((s) => s.setSessions);
  const [topicInput, setTopicInput] = useState('');

  useEffect(() => {
    loadSessions().then((real) => setSessions(mergeWithDemoSessions(real)));
  }, [setSessions]);

  const handleQuickStart = () => {
    if (topicInput.trim()) {
      // Store topic and start session
      useSessionStore.getState().setTopic(topicInput.trim());
      useSessionStore.getState().setStep('confidence');
      onNewSession();
    } else {
      onNewSession();
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero: Start a session */}
      <div className="bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-primary-200" />
            <span className="text-[11px] uppercase tracking-widest text-primary-200 font-semibold">Viva Voce</span>
          </div>

          <h2 className="text-2xl font-serif font-bold mb-2 leading-snug">
            What do you want to<br />understand today?
          </h2>
          <p className="text-primary-200 text-sm mb-6 max-w-sm leading-relaxed">
            Explain a concept. Your AI supervisor will find the cracks in your thinking.
          </p>

          {/* Inline topic input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickStart()}
              placeholder="e.g., How does TCP work?"
              className="flex-1 bg-white/10 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-primary-300 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
            />
            <button
              onClick={handleQuickStart}
              className="bg-white text-primary-800 font-semibold px-5 py-3 rounded-xl hover:bg-primary-50 transition-colors flex items-center gap-2 shrink-0"
            >
              Start <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Session history */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-8 h-8 text-warm-300 mx-auto mb-3" />
          <p className="text-warm-500 text-sm">Your tutorial journal is empty.</p>
          <p className="text-warm-400 text-xs mt-1">Start your first session above.</p>
        </div>
      ) : (
        <div>
          <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-widest mb-4">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-3 stagger-children">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`bg-white rounded-xl border border-warm-200 border-l-4 ${MODE_COLORS[s.routing_mode] || 'border-l-warm-300'} p-5 card-hover cursor-default`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-warm-900 text-[15px] leading-snug">{s.topic}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-warm-400">
                        {new Date(s.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                      {s.routing_mode && (
                        <span className="text-[10px] font-semibold text-warm-400 uppercase tracking-wider">
                          {MODE_LABELS[s.routing_mode] || s.routing_mode}
                        </span>
                      )}
                    </div>
                  </div>
                  <ConfidenceDelta before={s.confidence_before} after={s.confidence_after} />
                </div>
                {s.one_thing_to_remember && (
                  <p className="text-sm text-warm-600 leading-relaxed border-t border-warm-100 pt-2 mt-2">
                    {s.one_thing_to_remember}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer quote */}
      <div className="text-center mt-10 pb-4">
        <p className="text-xs text-warm-300 italic max-w-sm mx-auto leading-relaxed">
          "His great skill consisted, like Socrates, in helping us to learn and think for ourselves."
        </p>
        <p className="text-[10px] text-warm-300 mt-1">— On Benjamin Jowett, who established the Oxford tutorial system</p>
      </div>
    </div>
  );
}
