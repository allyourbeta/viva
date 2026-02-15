import { CheckCircle, AlertTriangle, Lightbulb, ArrowRight, BookOpen } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { saveSession } from '../api/supabase';
import { useState, useEffect } from 'react';

export default function LearningCard({ onDone }) {
  const topic = useSessionStore((s) => s.topic);
  const confidenceBefore = useSessionStore((s) => s.confidenceBefore);
  const learningCard = useSessionStore((s) => s.learningCard);
  const analysis = useSessionStore((s) => s.analysis);
  const routingMode = useSessionStore((s) => s.routingMode);
  const routingRationale = useSessionStore((s) => s.routingRationale);
  const routingPlan = useSessionStore((s) => s.routingPlan);
  const questions = useSessionStore((s) => s.questions);
  const answers = useSessionStore((s) => s.answers);
  const transcript = useSessionStore((s) => s.transcript);
  const sourceUrl = useSessionStore((s) => s.sourceUrl);
  const sourceText = useSessionStore((s) => s.sourceText);
  const sourceWasAutoSearched = useSessionStore((s) => s.sourceWasAutoSearched);
  const recordingDuration = useSessionStore((s) => s.recordingDuration);
  const addSession = useSessionStore((s) => s.addSession);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) return;
    const doSave = async () => {
      try {
        const session = await saveSession({
          topic,
          sourceUrl,
          sourceText,
          sourceWasAutoSearched,
          confidenceBefore,
          transcript,
          recordingDuration,
          analysis,
          routingMode,
          routingRationale,
          routingPlan,
          questions,
          learningCard,
          sourcesUsed: null,
        });
        addSession(session);
        setSaved(true);
      } catch (err) {
        console.error('Failed to save session:', err);
        setSaved(true); // Don't block the UI
      }
    };
    doSave();
  }, []);

  const card = learningCard || {};
  const confidenceAfter = card.confidence_after || '?';
  const diff = typeof confidenceAfter === 'number' ? confidenceAfter - confidenceBefore : null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="text-xl font-serif font-bold text-warm-900">Session Complete</h2>
        <p className="text-sm text-warm-500 mt-1">{topic}</p>
      </div>

      {/* Confidence before → after */}
      <div className="bg-white rounded-xl border border-warm-200 p-4 text-center">
        <p className="text-xs text-warm-400 uppercase tracking-wide font-semibold mb-1">Confidence</p>
        <p className="text-2xl font-serif font-bold">
          <span className="text-warm-400">{confidenceBefore}</span>
          <span className="text-warm-300 mx-2">→</span>
          <span className={diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-amber-600' : 'text-warm-700'}>
            {confidenceAfter}
          </span>
        </p>
        {diff !== null && diff !== 0 && (
          <p className={`text-xs mt-1 ${diff > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
            {diff > 0 ? `+${diff} improvement` : `${diff} — honest recalibration`}
          </p>
        )}
      </div>

      {/* Mastered */}
      {card.concepts_mastered?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-warm-700">Mastered</h3>
          </div>
          <div className="flex flex-wrap gap-2 ml-6">
            {card.concepts_mastered.map((c, i) => (
              <span key={i} className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Remaining gaps */}
      {card.remaining_gaps?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-warm-700">Still Working On</h3>
          </div>
          <div className="flex flex-wrap gap-2 ml-6">
            {card.remaining_gaps.map((g, i) => (
              <span key={i} className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-100">
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key correction */}
      {card.key_correction && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">Key Correction</p>
          <p className="text-sm text-red-800 leading-relaxed">{card.key_correction}</p>
        </div>
      )}

      {/* One thing to remember */}
      {card.one_thing_to_remember && (
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-1">Remember This</p>
              <p className="text-sm text-primary-900 leading-relaxed font-medium">{card.one_thing_to_remember}</p>
            </div>
          </div>
        </div>
      )}

      {/* Meta learning insight */}
      {card.meta_learning_insight && (
        <p className="text-sm text-warm-500 italic leading-relaxed">
          🧠 {card.meta_learning_insight}
        </p>
      )}

      {/* Next session seed */}
      {card.next_session_seed && (
        <div className="bg-warm-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-1">Next Session</p>
          <p className="text-sm text-warm-700 leading-relaxed">{card.next_session_seed}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onDone}
          className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-4 h-4" /> Back to Sessions
        </button>
      </div>
    </div>
  );
}
