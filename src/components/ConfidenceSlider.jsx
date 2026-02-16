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
    <div className="session-panel animate-fade-in">
      <div className="session-panel-inner text-center">
        <div className="mb-8">
          <div className="label-caps mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Before you begin</div>
          <h2 className="serif text-3xl md:text-4xl font-bold tracking-tight" style={{ color: '#f0ecff' }}>
            How well do you know this?
          </h2>
          <p className="text-base mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Rate your confidence in explaining
            <strong style={{ color: '#c4b5fd' }}> {topic}</strong>.
            Be honest — your examiner will compare.
          </p>
        </div>

        <div className="py-6">
          <div className="serif font-bold tracking-tight" style={{ fontSize: 80, color: '#c4b5fd', lineHeight: 1 }}>
            {confidence}
          </div>
          <div className="text-sm mt-2 font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {labels[confidence]}
          </div>
          <div className="mt-8 px-4 max-w-md mx-auto">
            <input
              type="range" min={1} max={10}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: '#a78bfa' }}
            />
            <div className="flex justify-between text-xs mt-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <span>No idea</span>
              <span>Expert</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-3 max-w-md mx-auto mb-8"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
            After the examination, your examiner will re-assess this.
            A drop in confidence is a good sign — it means you discovered what you didn't know.
          </p>
        </div>

        <button
          onClick={() => setStep('recording')}
          className="w-full max-w-md py-4 rounded-xl text-white text-lg font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: 'var(--gradient-indigo)', boxShadow: 'var(--glow-indigo)' }}>
          Start Explaining <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
