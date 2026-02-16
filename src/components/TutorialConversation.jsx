import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, ArrowRight } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { getOpeningResponse, getFollowUpResponse, wrapUpTutorial } from '../api/tutorial';
import { startListening, stopListening, speak } from '../services/speechService';
import SessionDashboard from './SessionDashboard';

/* ── Transcript-style message (NOT a chat bubble) ── */
function TranscriptEntry({ role, text, thinking }) {
  const isSupervisor = role === 'supervisor';
  return (
    <div className="animate-fade-in">
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
          <p className="text-sm text-[var(--ink-muted)] leading-relaxed">{thinking.key_weakness_targeted}</p>
        </div>
      )}
      <div className="grid grid-cols-[100px_1fr] gap-4">
        <div className="label-caps pt-1.5">{isSupervisor ? 'Supervisor' : 'Student'}</div>
        <div className={isSupervisor ? 'supervisor-block p-4' : 'student-block p-4'}>
          <p className={`leading-relaxed ${isSupervisor ? 'serif text-base' : 'text-sm'}`}>{text}</p>
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

  // R key shortcut for record/stop/submit
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        if (isLoading || isFinishing) return;
        if (!isRecording && currentAnswer.trim()) {
          handleSubmitAnswer((answerRef.current || currentAnswer).trim());
        } else if (isRecording) {
          handleStopRecording();
        } else {
          handleStartRecording();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRecording, isLoading, isFinishing, currentAnswer]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayItems, isLoading]);

  const addSupervisorResponse = (text, assessment) => {
    setDisplayItems((prev) => [...prev, { type: 'message', role: 'supervisor', text, thinking: assessment }]);
    if (assessment) { setAssessments((prev) => [...prev, assessment]); if (assessment.mode) setCurrentMode(assessment.mode); }
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

  const handleStopRecording = () => {
    stopListening();
    setIsRecording(false);
    // Auto-submit after brief pause for transcript to settle
    setTimeout(() => {
      const answer = (answerRef.current || currentAnswer).trim();
      if (answer) {
        handleSubmitAnswer(answer);
      }
    }, 500);
  };

  const handleSubmitAnswer = async (answer) => {
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
            <TranscriptEntry key={i} role={item.role} text={item.text} thinking={item.thinking} />
          ))}

          {isLoading && !isFinishing && (
            <div className="grid grid-cols-[100px_1fr] gap-4 animate-fade-in">
              <div className="label-caps pt-1.5">Supervisor</div>
              <div className="supervisor-block p-4">
                <div className="flex gap-1.5">
                  {[0, 0.2, 0.4].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--ink-faint)', animationDelay: `${d}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {isFinishing && (
            <div className="text-center py-8 animate-fade-in">
              <div className="label-caps mb-2">Preparing report</div>
              <p className="serif text-lg" style={{ color: 'var(--ink-muted)' }}>Reviewing the full conversation...</p>
            </div>)}
          <div ref={scrollRef} />
        </div>

        {/* Input — big centered record button */}
        {!isLoading && !isFinishing && (
          <div className="flex-1 flex flex-col items-center justify-center py-8 gap-4">
            {currentAnswer ? (
              <div className="w-full max-w-lg rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: 'var(--rule)', background: 'var(--panel)' }}>
                {currentAnswer}
              </div>
            ) : !isRecording && (
              <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>
                Your turn — speak clearly, aim for precision
              </p>
            )}

            {isRecording && (
              <p className="text-sm flex items-center gap-2" style={{ color: 'var(--oxblood)' }}>
                <span className="w-2.5 h-2.5 rounded-full animate-pulse-record" style={{ background: 'var(--oxblood)' }} />
                Listening...
              </p>
            )}

            <div className="flex items-center gap-4">
              {!isRecording && currentAnswer.trim() ? (
                <button onClick={() => handleSubmitAnswer((answerRef.current || currentAnswer).trim())}
                  className="w-20 h-20 rounded-full text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                  style={{ background: 'var(--indigo)' }}>
                  <ArrowRight className="w-8 h-8" />
                </button>
              ) : (
                <button onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className="w-20 h-20 rounded-full text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                  style={{ background: isRecording ? 'var(--oxblood)' : 'var(--ink)' }}>
                  {isRecording ? <Square className="w-8 h-8 fill-white" /> : <Mic className="w-8 h-8" />}
                </button>
              )}
            </div>

            <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
              {isRecording ? 'Click to stop' : currentAnswer.trim() ? 'Click to submit' : 'Press R or click to record'}
            </span>

            {roundCount >= 2 && !isRecording && (
              <button onClick={() => handleFinish()}
                className="mt-2 text-xs flex items-center gap-1"
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
