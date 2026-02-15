import { CheckCircle, AlertTriangle, XCircle, Eye, Brain, ArrowRight } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { generateSocraticQuestions } from '../api/claude';

function Section({ icon: Icon, title, color, children }) {
  return (
    <div>
      <div className={`flex items-center gap-2 mb-2`}>
        <Icon className={`w-4 h-4 ${color}`} />
        <h3 className="text-sm font-semibold text-warm-700">{title}</h3>
      </div>
      <div className="ml-6 space-y-1.5">
        {children}
      </div>
    </div>
  );
}

function ModeLabel({ mode }) {
  const config = {
    gap_fix: { label: 'Gap Fix', color: 'bg-red-100 text-red-700 border-red-200' },
    socratic_probe: { label: 'Socratic Probe', color: 'bg-primary-100 text-primary-700 border-primary-200' },
    level_up: { label: 'Level Up', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    conflict_resolution: { label: 'Conflict Resolution', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  };
  const c = config[mode] || config.socratic_probe;
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${c.color}`}>
      Mode: {c.label}
    </span>
  );
}

export default function AnalysisView() {
  const analysis = useSessionStore((s) => s.analysis);
  const confidenceBefore = useSessionStore((s) => s.confidenceBefore);
  const routingMode = useSessionStore((s) => s.routingMode);
  const routingRationale = useSessionStore((s) => s.routingRationale);
  const routingPlan = useSessionStore((s) => s.routingPlan);
  const sourceText = useSessionStore((s) => s.sourceText);
  const setQuestions = useSessionStore((s) => s.setQuestions);
  const setStep = useSessionStore((s) => s.setStep);
  const setError = useSessionStore((s) => s.setError);

  if (!analysis) return null;

  const confidenceGap = confidenceBefore - (analysis.confidence_assessment || 0);

  const handleStartQuestions = async () => {
    setError(null);
    setStep('analyzing');
    try {
      const questions = await generateSocraticQuestions(analysis, sourceText);
      setQuestions(questions);
      setStep('socratic');
    } catch (err) {
      console.error('Failed to generate questions:', err);
      setError('Failed to generate questions. Please try again.');
      setStep('analysis');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-serif font-bold text-warm-900">
        Your Understanding
      </h2>

      {/* Confidence comparison */}
      <div className="bg-white rounded-xl border border-warm-200 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-warm-400 uppercase tracking-wide font-semibold">Confidence</p>
          <p className="text-lg font-serif font-bold text-warm-900">
            You said <span className="text-primary-600">{confidenceBefore}</span>
            {' · '}
            Actual <span className={analysis.confidence_assessment >= confidenceBefore ? 'text-emerald-600' : 'text-amber-600'}>
              {analysis.confidence_assessment}
            </span>
          </p>
        </div>
        {Math.abs(confidenceGap) >= 2 && (
          <div className={`text-xs font-medium px-3 py-1 rounded-full ${
            confidenceGap > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {confidenceGap > 0 ? `Overconfident by ${confidenceGap}` : `Underconfident by ${Math.abs(confidenceGap)}`}
          </div>
        )}
      </div>

      {/* Analysis sections */}
      <div className="space-y-5">
        {analysis.solid_understanding?.length > 0 && (
          <Section icon={CheckCircle} title="Solid Understanding" color="text-emerald-500">
            {analysis.solid_understanding.map((item, i) => (
              <p key={i} className="text-sm text-warm-600 leading-relaxed">
                <strong className="text-warm-800">{item.concept}:</strong> {item.evidence}
              </p>
            ))}
          </Section>
        )}

        {analysis.fuzzy_areas?.length > 0 && (
          <Section icon={AlertTriangle} title="Fuzzy Areas" color="text-amber-500">
            {analysis.fuzzy_areas.map((item, i) => (
              <p key={i} className="text-sm text-warm-600 leading-relaxed">
                <strong className="text-warm-800">{item.concept}:</strong> {item.issue}
              </p>
            ))}
          </Section>
        )}

        {analysis.factual_errors?.length > 0 && (
          <Section icon={XCircle} title="Errors vs. Source" color="text-red-500">
            {analysis.factual_errors.map((item, i) => (
              <div key={i} className="text-sm bg-red-50 rounded-lg p-3 border border-red-100">
                <p className="text-red-800">
                  <span className="font-medium">You said:</span> "{item.learner_said}"
                </p>
                <p className="text-red-700 mt-1">
                  <span className="font-medium">Source says:</span> {item.source_says}
                </p>
                {item.why_it_matters && (
                  <p className="text-red-600 mt-1 text-xs">{item.why_it_matters}</p>
                )}
              </div>
            ))}
          </Section>
        )}

        {analysis.blind_spots?.length > 0 && (
          <Section icon={Eye} title="Blind Spots (Not Mentioned)" color="text-warm-400">
            {analysis.blind_spots.map((item, i) => (
              <p key={i} className="text-sm text-warm-600 leading-relaxed">
                <strong className="text-warm-800">{item.concept}:</strong> {item.source_reference}
              </p>
            ))}
          </Section>
        )}
      </div>

      {/* Meta insight */}
      {analysis.meta_learning_insight && (
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
          <p className="text-sm text-primary-800 italic">
            💡 {analysis.meta_learning_insight}
          </p>
        </div>
      )}

      {/* Routing decision — the agentic moment */}
      <div className="bg-warm-900 rounded-xl p-5 text-white space-y-3">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-primary-300" />
          <ModeLabel mode={routingMode} />
        </div>
        <p className="text-sm text-warm-300 leading-relaxed">
          {routingRationale}
        </p>
        {routingPlan?.length > 0 && (
          <div className="space-y-1">
            {routingPlan.map((step, i) => (
              <p key={i} className="text-xs text-warm-400">
                {step}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Start questions */}
      <button
        onClick={handleStartQuestions}
        className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
      >
        Start Questions <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
