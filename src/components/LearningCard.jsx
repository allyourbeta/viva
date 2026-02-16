import { ArrowRight } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { saveSession } from '../api/supabase';
import { useState, useEffect } from 'react';

export default function LearningCard({ onDone }) {
  const topic = useSessionStore((s) => s.topic);
  const confidenceBefore = useSessionStore((s) => s.confidenceBefore);
  const learningCard = useSessionStore((s) => s.learningCard);
  const routingMode = useSessionStore((s) => s.routingMode);
  const routingRationale = useSessionStore((s) => s.routingRationale);
  const routingPlan = useSessionStore((s) => s.routingPlan);
  const transcript = useSessionStore((s) => s.transcript);
  const sourceUrl = useSessionStore((s) => s.sourceUrl);
  const sourceText = useSessionStore((s) => s.sourceText);
  const sourceWasAutoSearched = useSessionStore((s) => s.sourceWasAutoSearched);
  const recordingDuration = useSessionStore((s) => s.recordingDuration);
  const addSession = useSessionStore((s) => s.addSession);
  const analysis = useSessionStore((s) => s.analysis);
  const questions = useSessionStore((s) => s.questions);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) return;
    const go = async () => {
      try {
        const session = await saveSession({
          topic, sourceUrl, sourceText, sourceWasAutoSearched, confidenceBefore,
          transcript, recordingDuration, analysis, routingMode, routingRationale,
          routingPlan, questions, learningCard, sourcesUsed: null,
        });
        addSession(session);
        setSaved(true);
      } catch (err) { console.error('Save failed:', err); setSaved(true); }
    };
    go();
  }, []);

  const card = learningCard || {};
  const after = card.confidence_after;
  const delta = typeof after === 'number' ? after - confidenceBefore : null;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="paper-card p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="label-caps">Tutorial report</div>
            <h1 className="mt-1 serif text-3xl font-semibold tracking-tight">{topic}</h1>
            <div className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>
              {routingMode && `Mode: ${routingMode.replace('_', ' ')} · `}
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Confidence reveal band */}
        <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid var(--rule)' }}>
          <div className="grid grid-cols-3" style={{ background: 'var(--white-glass)' }}>
            <div className="p-6 border-r" style={{ borderColor: 'var(--rule)' }}>
              <div className="label-caps">Before</div>
              <div className="mt-2 serif text-4xl" style={{ color: 'var(--oxblood)' }}>{confidenceBefore}</div>
            </div>
            <div className="p-6 border-r" style={{ borderColor: 'var(--rule)' }}>
              <div className="label-caps">After</div>
              <div className="mt-2 serif text-4xl font-semibold" style={{ color: 'var(--sage)' }}>{after ?? '?'}</div>
            </div>
            <div className="p-6">
              <div className="label-caps">Delta</div>
              <div className="mt-2 serif text-4xl" style={{ color: delta > 0 ? 'var(--sage)' : delta < 0 ? 'var(--oxblood)' : 'var(--ink-muted)' }}>
                {delta != null ? (delta > 0 ? `+${delta}` : delta) : '—'}
              </div>
            </div>
          </div>
          {delta != null && (
            <div className="px-6 py-3 text-sm border-t" style={{ background: 'var(--amber-bg)', borderColor: 'var(--rule)', color: 'var(--ink-muted)' }}>
              {delta > 0 ? 'Your understanding deepened through the tutorial.' : delta < 0 ? 'Honest recalibration — you know more about what you don\'t know.' : 'Confidence held steady.'}
            </div>
          )}
        </div>

        {/* Two-column content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: corrections & insights */}
          <div className="md:col-span-7 space-y-4">
            {card.key_correction && (
              <div className="rounded-2xl p-5" style={{ background: 'var(--white-glass)', border: '1px solid var(--rule)' }}>
                <div className="label-caps mb-2">Key correction</div>
                <p className="text-sm leading-relaxed">{card.key_correction}</p>
              </div>
            )}
            {card.one_thing_to_remember && (
              <div className="rounded-2xl p-5" style={{ background: 'var(--white-glass)', border: '1px solid var(--rule)' }}>
                <div className="label-caps mb-2">One thing to remember</div>
                <p className="serif text-xl tracking-tight" style={{ color: 'var(--indigo)' }}>
                  "{card.one_thing_to_remember}"
                </p>
              </div>
            )}
            {card.meta_learning_insight && (
              <div className="rounded-2xl p-5" style={{ background: 'var(--white-glass)', border: '1px solid var(--rule)' }}>
                <div className="label-caps mb-2">Meta-learning insight</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>{card.meta_learning_insight}</p>
              </div>
            )}
          </div>

          {/* Right: concepts & next */}
          <div className="md:col-span-5 space-y-4">
            {card.concepts_mastered?.length > 0 && (
              <div className="rounded-2xl p-5 pill-mastered" style={{ border: '1px solid var(--rule)' }}>
                <div className="label-caps mb-2" style={{ color: 'var(--sage)' }}>Mastered</div>
                <ul className="space-y-1.5 text-sm">
                  {card.concepts_mastered.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {card.remaining_gaps?.length > 0 && (
              <div className="rounded-2xl p-5 pill-probing" style={{ border: '1px solid var(--rule)' }}>
                <div className="label-caps mb-2" style={{ color: 'var(--amber-accent)' }}>Remaining gaps</div>
                <ul className="space-y-1.5 text-sm">
                  {card.remaining_gaps.map((g, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {card.next_session_seed && (
              <div className="rounded-2xl border border-dashed p-4" style={{ borderColor: 'var(--rule)', background: 'var(--panel)' }}>
                <div className="label-caps mb-1">Next session seed</div>
                <p className="serif text-sm font-medium">{card.next_session_seed}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t flex items-center justify-between" style={{ borderColor: 'var(--rule)' }}>
          <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>Saved to your tutorial history.</span>
          <button onClick={onDone}
            className="rounded-xl px-6 py-3 text-sm font-medium text-white flex items-center gap-2"
            style={{ background: 'var(--indigo)' }}>
            Back to ledger <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
