import useSessionStore from '../store/sessionStore';

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
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-serif font-bold text-warm-900 mb-1">
          Before you explain...
        </h2>
        <p className="text-sm text-warm-500">
          How confident are you that you can explain <strong className="text-warm-700">{topic}</strong> clearly?
          Be honest — your supervisor will compare this to your actual performance.
        </p>
      </div>

      <div className="text-center py-8">
        <div className="text-6xl font-serif font-bold text-primary-600 mb-2">
          {confidence}
        </div>
        <div className="text-sm text-warm-500 mb-8">
          {labels[confidence]}
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="w-full max-w-xs accent-primary-600"
        />
        <div className="flex justify-between text-xs text-warm-400 max-w-xs mx-auto mt-1">
          <span>No idea</span>
          <span>Expert</span>
        </div>
      </div>

      <button
        onClick={() => setStep('recording')}
        className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
      >
        Start Explaining →
      </button>
    </div>
  );
}
