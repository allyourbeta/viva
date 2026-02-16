import useSessionStore from '../store/sessionStore';
import { ArrowRight } from 'lucide-react';

export default function ConfidenceSlider() {
  const topic = useSessionStore((s) => s.topic);
  const confidence = useSessionStore((s) => s.confidenceBefore);
  const setConfidence = useSessionStore((s) => s.setConfidenceBefore);
  const setStep = useSessionStore((s) => s.setStep);

  const labels = {
    1: 'No idea', 2: 'Vaguely familiar', 3: 'Shaky',
    4: 'Some basics', 5: 'Half-confident', 6: 'Decent',
    7: 'Pretty good', 8: 'Solid', 9: 'Very confident', 10: 'Expert',
  };

  return (
    <div className="max-w-lg mx-auto animate-fade-in">
      <div className="paper-card-elevated p-8 text-center space-y-8">
        <div>
          <div className="label-caps mb-2">Before you begin</div>
          <h2 className="serif text-2xl font-bold tracking-tight">
            How well do you know this?
          </h2>
          <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
            Rate your confidence in explaining
            <strong className="font-semibold" style={{ color: 'var(--ink)' }}> {topic}</strong>.
            Be honest — your supervisor will compare.
          </p>
        </div>

        <div className="py-4">
          <div className="serif text-7xl font-bold tracking-tight" style={{ color: 'var(--indigo)' }}>
            {confidence}
          </div>
          <div className="text-sm mt-2 font-semibold" style={{ color: 'var(--ink-muted)' }}>
            {labels[confidence]}
          </div>
          <div className="mt-8 px-4">
            <input
              type="range" min={1} max={10}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--indigo)' }}
            />
            <div className="flex justify-between text-xs mt-1 font-medium" style={{ color: 'var(--ink-faint)' }}>
              <span>No idea</span>
              <span>Expert</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ background: 'var(--amber-bg)', border: '1px solid var(--rule-light)' }}>
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            After the tutorial, your supervisor will re-assess this.
            A drop in confidence is a good sign — it means you discovered what you didn't know.
          </p>
        </div>

        <button
          onClick={() => setStep('recording')}
          className="w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'var(--gradient-indigo)', boxShadow: 'var(--glow-indigo)' }}>
          Start Explaining <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
