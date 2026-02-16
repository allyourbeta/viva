import { ArrowRight, Target, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { saveSession } from '../api/supabase';
import { useState, useEffect } from 'react';

export default function LearningCard({ onDone }) {
  const topic = useSessionStore((s) => s.topic);
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
  const confidenceBefore = useSessionStore((s) => s.confidenceBefore);
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* ══════ HERO: One thing to remember ══════ */}
      {card.one_thing_to_remember && (
        <div className="hero-gradient rounded-2xl p-8 md:p-10 text-center mb-8 animate-scale-in">
          <div className="relative z-10">
            <div className="text-xs uppercase tracking-widest mb-4 opacity-60 font-medium">
              One thing to remember
            </div>
            <p className="serif text-2xl md:text-3xl font-bold leading-snug tracking-tight max-w-2xl mx-auto">
              &ldquo;{card.one_thing_to_remember}&rdquo;
            </p>
            <div className="mt-5 text-sm opacity-50">
              — from your viva on {topic}
            </div>
          </div>
        </div>
      )}

      <div className="paper-card p-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="label-caps">Tutorial report</div>
            <h1 className="mt-1 serif text-3xl font-bold tracking-tight">{topic}</h1>
            <div className="mt-1 text-sm" style={{ color: 'var(--ink-muted)' }}>
              {routingMode && `Mode: ${routingMode.replace('_', ' ')} · `}
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* ══ Supervisor's assessment ══ */}
        <div className="rounded-2xl overflow-hidden mb-8 animate-stagger-1" style={{ border: '1px solid var(--rule)' }}>
          <div className="p-6 text-center" style={{ background: 'var(--white-glass)' }}>
            <div className="label-caps mb-3">Supervisor&apos;s Assessment</div>
            <div className="serif text-6xl font-bold animate-count-up"
              style={{ color: typeof after === 'number' && after >= 6 ? 'var(--sage)' : 'var(--oxblood)' }}>
              {after ?? '?'}<span className="text-2xl opacity-40">/10</span>
            </div>
          </div>
        </div>

        {/* Two-column content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: corrections & insights */}
          <div className="md:col-span-7 space-y-4">
            {card.key_correction && (
              <div className="rounded-2xl p-5 animate-stagger-2"
                style={{ background: 'var(--white-glass)', border: '1px solid var(--rule)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" style={{ color: 'var(--oxblood)' }} />
                  <div className="label-caps" style={{ color: 'var(--oxblood)' }}>Key correction</div>
                </div>
                <p className="text-sm leading-relaxed">{card.key_correction}</p>
              </div>
            )}
            {card.meta_learning_insight && (
              <div className="rounded-2xl p-5 animate-stagger-3"
                style={{ background: 'var(--white-glass)', border: '1px solid var(--rule)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4" style={{ color: 'var(--indigo)' }} />
                  <div className="label-caps" style={{ color: 'var(--indigo)' }}>How you think</div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                  {card.meta_learning_insight}
                </p>
              </div>
            )}
          </div>

          {/* Right: concepts & next */}
          <div className="md:col-span-5 space-y-4">
            {card.concepts_mastered?.length > 0 && (
              <div className="rounded-2xl p-5 pill-mastered animate-stagger-2" style={{ border: '1px solid var(--rule)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4" style={{ color: 'var(--sage)' }} />
                  <div className="label-caps" style={{ color: 'var(--sage)' }}>Mastered</div>
                </div>
                <ul className="space-y-1.5 text-sm">
                  {card.concepts_mastered.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--sage)' }} /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {card.remaining_gaps?.length > 0 && (
              <div className="rounded-2xl p-5 pill-probing animate-stagger-3" style={{ border: '1px solid var(--rule)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4" style={{ color: 'var(--amber-accent)' }} />
                  <div className="label-caps" style={{ color: 'var(--amber-accent)' }}>Remaining gaps</div>
                </div>
                <ul className="space-y-1.5 text-sm">
                  {card.remaining_gaps.map((g, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: 'var(--amber-accent)' }} /> {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ══════ NEXT SESSION BRIDGE ══════ */}
        {card.next_session_seed && (
          <div className="mt-8 hero-gradient rounded-2xl p-6 animate-stagger-4">
            <div className="relative z-10 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.2)' }}>
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest mb-1 opacity-70 font-medium">
                  Your next challenge
                </div>
                <p className="serif text-base font-medium leading-relaxed">
                  {card.next_session_seed}
                </p>
                <p className="text-xs mt-2 opacity-60">
                  Pick this up next — your supervisor will know where you left off.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--rule)' }}>
          <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Saved to your tutorial history.
          </span>
          <button onClick={onDone}
            className="rounded-xl px-6 py-3 text-sm font-semibold text-white flex items-center gap-2 transition-all hover:scale-[1.02]"
            style={{ background: 'var(--gradient-indigo)', boxShadow: 'var(--glow-indigo)' }}>
            Back to ledger <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
