import useSessionStore from '../store/sessionStore';
import SourceInput from './SourceInput';
import ConfidenceSlider from './ConfidenceSlider';
import VoiceRecorder from './VoiceRecorder';
import TutorialConversation from './TutorialConversation';
import LearningCard from './LearningCard';
import { ArrowLeft } from 'lucide-react';

const STEPS = [
  { key: 'source', label: 'Topic', desc: 'Choose what to explain' },
  { key: 'confidence', label: 'Self-assess', desc: 'Rate your confidence' },
  { key: 'recording', label: 'Explain', desc: 'Speak your understanding' },
  { key: 'tutorial', label: 'Tutorial', desc: 'Your supervisor responds' },
  { key: 'card', label: 'Report', desc: 'What you learned' },
];

export default function SessionWizard({ onComplete, onBack }) {
  const step = useSessionStore((s) => s.step);
  const currentIdx = STEPS.findIndex((s) => s.key === step);
  const isTutorial = step === 'tutorial';
  const isCard = step === 'card';

  return (
    <div className="animate-fade-in">
      {/* Progress bar — hide during tutorial and card (they have their own headers) */}
      {!isTutorial && !isCard && (
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} style={{ color: 'var(--ink-muted)' }}
            className="hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <div key={s.key}
                  className="h-1.5 flex-1 rounded-full transition-colors"
                  style={{
                    background: i <= currentIdx ? 'var(--indigo)' : 'var(--rule)',
                    opacity: i <= currentIdx ? 1 : 0.3,
                  }} />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="label-caps">{STEPS[currentIdx]?.label || step}</span>
              <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                — {STEPS[currentIdx]?.desc}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step content */}
      {step === 'source' && <SourceInput />}
      {step === 'confidence' && <ConfidenceSlider />}
      {step === 'recording' && <VoiceRecorder />}
      {step === 'tutorial' && <TutorialConversation />}
      {step === 'card' && <LearningCard onDone={onComplete} />}
    </div>
  );
}
