import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, GraduationCap, User, Brain, ArrowRight, Zap } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { getOpeningResponse, getFollowUpResponse, wrapUpTutorial } from '../api/tutorial';
import { startListening, stopListening, speak } from '../services/speechService';
import SessionDashboard, { MODE_CONFIG } from './SessionDashboard';

/* ── Message Components ── */
function ModeShiftNotice({ fromMode, toMode }) {
  if (!fromMode || !toMode || fromMode === toMode) return null;
  const to = MODE_CONFIG[toMode] || MODE_CONFIG.socratic_probe;
  return (
    <div className="flex justify-center animate-fade-in py-2">
      <div className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${to.bg} ${to.text}`}>
        <Zap className="w-3 h-3" />
        <span>Shifted to <strong>{to.label}</strong> mode</span>
      </div>
    </div>
  );
}

function Message({ role, text, isLatest }) {
  const isSupervisor = role === 'supervisor';
  return (
    <div className={`flex gap-3 ${isSupervisor ? '' : 'flex-row-reverse'} ${isLatest ? 'animate-fade-in' : ''}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        isSupervisor
          ? 'bg-gradient-to-br from-primary-600 to-primary-800 shadow-sm shadow-primary-600/20'
          : 'bg-warm-200'
      }`}>
        {isSupervisor
          ? <GraduationCap className="w-4 h-4 text-white" />
          : <User className="w-4 h-4 text-warm-500" />
        }
      </div>
      <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 ${
        isSupervisor
          ? 'bg-white border border-warm-200 text-warm-800 shadow-sm'
          : 'bg-primary-600 text-white shadow-sm shadow-primary-600/10'
      }`}>
        <p className={`leading-relaxed ${isSupervisor ? 'text-[15px]' : 'text-sm'}`}>{text}</p>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function TutorialConversation() {
  const topic = useSessionStore((s) => s.topic);
  const sourceText = useSessionStore((s) => s.sourceText);
  const transcript = useSessionStore((s) => s.transcript);
  const confidenceBefore = useSessionStore((s) => s.confidenceBefore);
  const setLearningCard = useSessionStore((s) => s.setLearningCard);
  const setRouting = useSessionStore((s) => s.setRouting);
  const setStep = useSessionStore((s) => s.setStep);

  const [displayItems, setDisplayItems] = useState([]);
  const [apiHistory, setApiHistory] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [roundCount, setRoundCount] = useState(0);
  const [currentMode, setCurrentMode] = useState('socratic_probe');
  const [isFinishing, setIsFinishing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef(null);
  const answerRef = useRef('');

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayItems, isLoading]);

  const addSupervisorResponse = (text, assessment, prevMode) => {
    const newMode = assessment?.mode;

    // Show mode shift if changed
    if (prevMode && newMode && prevMode !== newMode) {
      setDisplayItems((prev) => [...prev, { type: 'mode_shift', from: prevMode, to: newMode }]);
    }

    // Add the message
    setDisplayItems((prev) => [...prev, { type: 'message', role: 'supervisor', text }]);

    if (assessment) {
      setAssessments((prev) => [...prev, assessment]);
    }
    if (newMode) setCurrentMode(newMode);

    speak(text);
  };

  // Opening response
  useEffect(() => {
    let cancelled = false;
    async function getOpening() {
      try {
        const result = await getOpeningResponse(sourceText, transcript, confidenceBefore);
        if (cancelled) return;

        const assessment = result.internal_assessment;
        if (assessment) {
          setRouting(assessment.mode || 'socratic_probe', assessment.key_weakness_targeted || '', []);
        }

        setApiHistory([
          { role: 'user', content: `Student's explanation:\n${transcript}` },
          { role: 'assistant', content: result.response },
        ]);

        setIsLoading(false);
        addSupervisorResponse(result.response, assessment, null);
        setRoundCount(1);
      } catch (err) {
        console.error('Opening failed:', err);
        if (!cancelled) {
          setIsLoading(false);
          setDisplayItems([{ type: 'message', role: 'supervisor', text: "Let's discuss what you just explained. What do you think was the most important point?" }]);
        }
      }
    }
    getOpening();
    return () => { cancelled = true; };
  }, []);

  const handleStartRecording = () => {
    setCurrentAnswer('');
    answerRef.current = '';
    const started = startListening({
      onInterim: (text) => { setCurrentAnswer(text); answerRef.current = text; },
      onFinal: (text) => { setCurrentAnswer(text); answerRef.current = text; },
      onError: () => {},
    });
    if (started) setIsRecording(true);
  };

  const handleStopRecording = () => {
    stopListening();
    setIsRecording(false);
  };

  const handleSubmitAnswer = async () => {
    const answer = (answerRef.current || currentAnswer).trim();
    if (!answer) return;

    setDisplayItems((prev) => [...prev, { type: 'message', role: 'student', text: answer }]);
    setCurrentAnswer('');
    setIsLoading(true);

    const newHistory = [...apiHistory, { role: 'user', content: answer }];

    try {
      const result = await getFollowUpResponse(newHistory, sourceText);
      setApiHistory([...newHistory, { role: 'assistant', content: result.response }]);
      setRoundCount((r) => r + 1);
      setIsLoading(false);

      const prevMode = currentMode;
      addSupervisorResponse(result.response, result.internal_assessment || null, prevMode);

      if (!result.should_continue || roundCount >= 4) {
        if (roundCount >= 4) {
          setTimeout(() => handleFinish([...newHistory, { role: 'assistant', content: result.response }]), 2000);
        }
      }
    } catch (err) {
      console.error('Follow-up failed:', err);
      setIsLoading(false);
      setDisplayItems((prev) => [...prev, {
        type: 'message', role: 'supervisor',
        text: "Good point. What would you say is the key takeaway from everything we've discussed?"
      }]);
    }
  };

  const handleFinish = async (history) => {
    setIsFinishing(true);
    setIsLoading(true);
    try {
      const card = await wrapUpTutorial(history || apiHistory, topic, confidenceBefore);
      setLearningCard(card);
      if (card.tutorial_mode) setRouting(card.tutorial_mode, '', []);
      setStep('card');
    } catch (err) {
      console.error('Wrap-up failed:', err);
      setStep('card');
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* LEFT: Conversation Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2">
          {displayItems.map((item, i) => {
            if (item.type === 'mode_shift') {
              return <ModeShiftNotice key={i} fromMode={item.from} toMode={item.to} />;
            }
            return <Message key={i} role={item.role} text={item.text} isLatest={i === displayItems.length - 1} />;
          })}

          {isLoading && !isFinishing && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-warm-200 rounded-2xl px-5 py-4 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                  <span className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                  <span className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                </div>
              </div>
            </div>
          )}

          {isFinishing && (
            <div className="text-center py-8 animate-fade-in">
              <Brain className="w-8 h-8 text-primary-400 mx-auto mb-3 animate-pulse" />
              <p className="text-sm font-medium text-warm-600">Preparing your session card...</p>
              <p className="text-xs text-warm-400 mt-1">Reviewing the full conversation</p>
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Input area */}
        {!isLoading && !isFinishing && (
          <div className="border-t border-warm-200 pt-4 pb-2 space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isRecording ? 'bg-red-500 animate-pulse-record' : 'bg-primary-600 hover:bg-primary-700 shadow-sm'
                }`}
              >
                {isRecording ? <Square className="w-4 h-4 text-white fill-white" /> : <Mic className="w-5 h-5 text-white" />}
              </button>

              <div className="flex-1 min-h-[48px] bg-white rounded-xl border border-warm-200 px-4 py-3 text-sm text-warm-700">
                {isRecording ? (
                  <span className="text-red-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    Listening...
                  </span>
                ) : currentAnswer ? (
                  currentAnswer
                ) : (
                  <span className="text-warm-300">Tap mic to respond to your supervisor...</span>
                )}
              </div>

              {!isRecording && currentAnswer.trim() && (
                <button
                  onClick={handleSubmitAnswer}
                  className="w-12 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 flex items-center justify-center shrink-0 shadow-sm"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            {roundCount >= 2 && (
              <button
                onClick={() => handleFinish()}
                className="w-full py-2 text-xs text-warm-400 hover:text-warm-600 transition-colors flex items-center justify-center gap-1"
              >
                End tutorial & see session card <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: Session Dashboard */}
      <div className="w-72 shrink-0 overflow-y-auto hidden lg:block">
        <SessionDashboard
          topic={topic}
          confidenceBefore={confidenceBefore}
          currentMode={currentMode}
          assessments={assessments}
          roundCount={roundCount}
          elapsed={elapsed}
        />
      </div>
    </div>
  );
}
