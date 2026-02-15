import useSessionStore from '../store/sessionStore';
import SourceInput from './SourceInput';
import ConfidenceSlider from './ConfidenceSlider';
import VoiceRecorder from './VoiceRecorder';
import TutorialConversation from './TutorialConversation';
import LearningCard from './LearningCard';
import { ArrowLeft } from 'lucide-react';

const STEP_LABELS = {
  source: 'Topic',
  confidence: 'Self-Assess',
  recording: 'Explain',
  tutorial: 'Tutorial',
  card: 'Session Card',
};

const STEP_ORDER = ['source', 'confidence', 'recording', 'tutorial', 'card'];

export default function SessionWizard({ onComplete, onBack }) {
  const step = useSessionStore((s) => s.step);
  const currentIdx = STEP_ORDER.indexOf(step);

  return (
    <div className="animate-fade-in">
      {/* Progress + back */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="text-warm-400 hover:text-warm-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex gap-1.5">
            {STEP_ORDER.map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  STEP_ORDER.indexOf(s) <= currentIdx ? 'bg-primary-500' : 'bg-warm-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-warm-400 mt-1.5">
            {STEP_LABELS[step] || step}
          </p>
        </div>
      </div>

      {/* Step content */}
      {step === 'source' && <SourceInput />}
      {step === 'confidence' && <ConfidenceSlider />}
      {step === 'recording' && <VoiceRecorder />}
      {step === 'tutorial' && <TutorialConversation />}
      {step === 'card' && <LearningCard onDone={onComplete} />}
    </div>
  );
}
