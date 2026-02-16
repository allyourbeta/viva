import useSessionStore from '../store/sessionStore';
import SourceInput from './SourceInput';
import ConfidenceSlider from './ConfidenceSlider';
import VoiceRecorder from './VoiceRecorder';
import TutorialConversation from './TutorialConversation';
import LearningCard from './LearningCard';
import { ArrowLeft } from 'lucide-react';

const STEPS = [
  { key: 'source', label: 'Topic', desc: 'Choose your subject' },
  { key: 'confidence', label: 'Self-assess', desc: 'Rate your confidence' },
  { key: 'recording', label: 'Explain', desc: 'Speak your understanding' },
  { key: 'tutorial', label: 'Examination', desc: 'Your examiner responds' },
  { key: 'card', label: 'Report', desc: 'What you learned' },
];

export default function SessionWizard({ onComplete, onBack }) {
  const step = useSessionStore((s) => s.step);

  return (
    <div className="animate-fade-in">
      {/* Step content — all steps now self-contained visually */}
      {step === 'source' && <SourceInput />}
      {step === 'confidence' && <ConfidenceSlider />}
      {step === 'recording' && <VoiceRecorder />}
      {step === 'tutorial' && <TutorialConversation />}
      {step === 'card' && <LearningCard onDone={onComplete} />}
    </div>
  );
}
