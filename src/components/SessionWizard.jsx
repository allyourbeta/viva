import useSessionStore from '../store/sessionStore';
import SourceInput from './SourceInput';
import ConfidenceSlider from './ConfidenceSlider';
import VoiceRecorder from './VoiceRecorder';
import AnalysisView from './AnalysisView';
import SocraticLoop from './SocraticLoop';
import LearningCard from './LearningCard';
import LoadingState from './ui/LoadingState';
import { ArrowLeft } from 'lucide-react';

const STEP_LABELS = {
  source: 'Choose Topic',
  confidence: 'Self-Assess',
  recording: 'Explain',
  analyzing: 'Analyzing',
  analysis: 'Review',
  socratic: 'Questions',
  card: 'Session Card',
};

const STEP_ORDER = ['source', 'confidence', 'recording', 'analyzing', 'analysis', 'socratic', 'card'];

export default function SessionWizard({ onComplete, onBack }) {
  const step = useSessionStore((s) => s.step);
  const currentIdx = STEP_ORDER.indexOf(step);

  return (
    <div className="animate-fade-in">
      {/* Progress + back button */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="text-warm-400 hover:text-warm-600 transition-colors"
          title="Back to history"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex gap-1.5">
            {STEP_ORDER.filter(s => s !== 'analyzing').map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  STEP_ORDER.indexOf(s) <= currentIdx ? 'bg-primary-500' : 'bg-warm-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-warm-400 mt-1.5">
            {STEP_LABELS[step]}
          </p>
        </div>
      </div>

      {/* Step content */}
      {step === 'source' && <SourceInput />}
      {step === 'confidence' && <ConfidenceSlider />}
      {step === 'recording' && <VoiceRecorder />}
      {step === 'analyzing' && <LoadingState />}
      {step === 'analysis' && <AnalysisView />}
      {step === 'socratic' && <SocraticLoop />}
      {step === 'card' && <LearningCard onDone={onComplete} />}
    </div>
  );
}
