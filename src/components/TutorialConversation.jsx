import { useState, useRef, useEffect } from 'react';
import { Mic, Square, ArrowRight } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { getOpeningResponse, getFollowUpResponse, wrapUpTutorial } from '../api/tutorial';
import { startListening, stopListening, speak } from '../services/speechService';
import SessionDashboard from './SessionDashboard';

/* ── Transcript-style message (NOT a chat bubble) ── */
function TranscriptEntry({ role, text, thinking, isNew }) {
  const isSupervisor = role === 'supervisor';
  return (
    <div className={`animate-fade-in ${isNew ? '' : ''}`}>
      {/* Tutor thinking note — appears BEFORE supervisor messages */}
      {thinking && isSupervisor && (
        <div className="tutor-note px-4 py-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="label-caps">{
              thinking.mode === 'gap_fix' ? 'Fixing a gap'
              : thinking.mode === 'level_up' ? 'Pushing deeper'
              : thinking.mode === 'conflict_resolution' ? 'Resolving conflict'
              : 'Probing your understanding'
            }</div>
          </div>
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">
            {thinking.key_weakness_targeted}
          </p>
        </div>
      )}

      {/* The actual message */}
      <div className="grid grid-cols-[100px_1fr] gap-4">
        <div className="label-caps pt-1.5">
          {isSupervisor ? 'Supervisor' : 'Student'}
        </div>
        <div className={isSupervisor ? 'supervisor-block p-4' : 'student-block p-4'}>
          <p className={`leading-relaxed ${isSupervisor ? 'serif text-base' : 'text-sm'}`}>
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

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

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayItems, isLoading]);

  const addSupervisorResponse = (text, assessment, prevMode) => {
    setDisplayItems((prev) => [
      ...prev,
      { type: 'message', role: 'supervisor', text, thinking: assessment },
    ]);
    if (assessment) {
      setAssessments((prev) => [...prev, assessment]);
      if (assessment.mode) setCurrentMode(assessment.mode);
    }
    speak(text);
  };

  // Opening
  useEffect(() => {
    let cancelled = false;
    async function go() {
      try {
        const result = await getOpeningResponse(sourceText, transcript, confidenceBefore);
        if (cancelled) return;
        const a = result.internal_assessment;
        if (a) setRouting(a.mode || 'socratic_probe', a.key_weakness_targeted || '', []);
        setApiHistory([
          { role: 'user', content: `Student's explanation:\n${transcript}` },
          { role: 'assistant', content: result.response },
        ]);
        setIsLoading(false);
        addSupervisorResponse(result.response, a, null);
        setRoundCount(1);
      } catch (err) {
        console.error('Opening failed:', err);
        if (!cancelled) {
          setIsLoading(false);
          setDisplayItems([{ type: 'message', role: 'supervisor', text: "Let's discuss what you just explained. What was the most important point?" }]);
        }
      }
    }
    go();
    return () => { cancelled = true; };
  }, []);

  const handleStartRecording = () => {
    setCurrentAnswer('');
    answerRef.current = '';
    const ok = startListening({
      onInterim: (t) => { setCurrentAnswer(t); answerRef.current = t; },
      onFinal: (t) => { setCurrentAnswer(t); answerRef.current = t; },
      onError: () => {},
    });
    if (ok) setIsRecording(true);
  };

  const handleStopRecording = () => { stopListening(); setIsRecording(false); };

  const handleSubmit = async () => {
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
      addSupervisorResponse(result.response, result.internal_assessment || null, currentMode);
      if (!result.should_continue || roundCount >= 4) {
        if (roundCount >= 4) setTimeout(() => handleFinish([...newHistory, { role: 'assistant', content: result.response }]), 2000);
      }
    } catch (err) {
      console.error('Follow-up failed:', err);
      setIsLoading(false);
      setDisplayItems((prev) => [...prev, { type: 'message', role: 'supervisor', text: "Good point. What's the key takeaway from our discussion?" }]);
    }
  };

  const handleFinish = async (history) => {
    setIsFinishing(true); setIsLoading(true);
    try {
      const card = await wrapUpTutorial(history || apiHistory, topic, confidenceBefore);
      setLearningCard(card);
      if (card.tutorial_mode) setRouting(card.tutorial_mode, '', []);
      setStep('card');
    } catch (err) { console.error('Wrap-up failed:', err); setStep('card'); }
  };

  return (
    <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-120px)]">
      {/* LEFT: Transcript (7 cols) */}
      <section className="col-span-12 md:col-span-8 paper-card flex flex-col">
        {/* Header strip */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--rule-light)' }}>
          <div>
            <div className="label-caps">Topic</div>
            <div className="serif font-semibold text-lg mt-0.5">{topic}</div>
          </div>
          <div className="flex items-center gap-4">
            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="w-2.5 h-2.5 rounded-full transition-colors"
                  style={{
                    background: n <= roundCount ? 'var(--indigo)' : 'var(--rule)',
                    opacity: n <= roundCount ? 1 : 0.4,
                  }} />
              ))}
            </div>
            <div className="text-sm" style={{ color: 'var(--ink-muted)' }}>
              <span>Exchange {roundCount} of ~5</span>
              <span className="mx-2">·</span>
              <span>{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {displayItems.map((item, i) => (
            <TranscriptEntry
              key={i}
              role={item.role}
              text={item.text}
              thinking={item.thinking}
              isNew={i === displayItems.length - 1}
            />
          ))}

          {isLoading && !isFinishing && (
            <div className="grid grid-cols-[100px_1fr] gap-4 animate-fade-in">
              <div className="label-caps pt-1.5">Supervisor</div>
              <div className="supervisor-block p-4">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--ink-faint)' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--ink-faint)', animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--ink-faint)', animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          {isFinishing && (
            <div className="text-center py-8 animate-fade-in">
              <div className="label-caps mb-2">Preparing report</div>
              <p className="serif text-lg" style={{ color: 'var(--ink-muted)' }}>Reviewing the full conversation...</p>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        {!isLoading && !isFinishing && (
          <div className="border-t px-6 py-5" style={{ borderColor: 'var(--rule-light)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="label-caps">Your turn</span>
              <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>Tap mic to record</span>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1 rounded-xl border px-4 py-3 text-sm min-h-[48px]"
                style={{ borderColor: 'var(--rule)', background: 'var(--panel)' }}>
                {isRecording ? (
                  <span className="flex items-center gap-2" style={{ color: 'var(--oxblood)' }}>
                    <span className="w-2 h-2 rounded-full animate-pulse-record" style={{ background: 'var(--oxblood)' }} />
                    Listening...
                  </span>
                ) : currentAnswer ? (
                  <span>{currentAnswer}</span>
                ) : (
                  <span style={{ color: 'var(--ink-faint)' }}>Speak clearly. Aim for precision, not length.</span>
                )}
              </div>
              {!isRecording && currentAnswer.trim() ? (
                <button onClick={handleSubmit}
                  className="rounded-xl px-5 py-3 text-sm font-medium text-white"
                  style={{ background: 'var(--indigo)' }}>
                  Submit
                </button>
              ) : (
                <button onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className="rounded-xl px-4 py-3 text-white flex items-center gap-2"
                  style={{ background: isRecording ? 'var(--oxblood)' : 'var(--ink)' }}>
                  {isRecording ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-4 h-4" />}
                  <span className="text-sm">{isRecording ? 'Stop' : 'Record'}</span>
                </button>
              )}
            </div>
            {roundCount >= 2 && (
              <button onClick={() => handleFinish()}
                className="mt-3 w-full text-center text-xs py-2 flex items-center justify-center gap-1"
                style={{ color: 'var(--ink-muted)' }}>
                End tutorial & see report <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </section>

      {/* RIGHT: Docket (4 cols) */}
      <aside className="hidden md:flex md:col-span-4 flex-col gap-4">
        <SessionDashboard
          topic={topic}
          confidenceBefore={confidenceBefore}
          currentMode={currentMode}
          assessments={assessments}
          roundCount={roundCount}
          elapsed={elapsed}
        />
      </aside>
    </div>
  );
}
