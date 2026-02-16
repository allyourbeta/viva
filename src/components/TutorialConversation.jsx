import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, ArrowRight } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { getOpeningResponse, getFollowUpResponse, getClosingResponse, wrapUpTutorial } from '../api/tutorial';
import { startListening, stopListening, speak } from '../services/speechService';
import { startChunkedAnalysis, stopChunkedAnalysis, finishAnalysis } from '../services/chunkedAnalysis';
import SessionDashboard from './SessionDashboard';
import TranscriptEntry from './TranscriptEntry';

// TranscriptEntry uses: supervisor-block, student-block, tutor-note, 'Supervisor', 'Student'

const MAX_RESPONSE_SECONDS = 60;
const MIN_ROUNDS = 2; // Minimum exchanges before closing (bump to 4-5 for production)

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
  const [responseElapsed, setResponseElapsed] = useState(0);
  const responseTimerRef = useRef(null);
  const scrollRef = useRef(null);
  const answerRef = useRef('');

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // R key shortcut
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
    setResponseElapsed(0);
    // Start background pre-calling while user speaks
    const isFinal = roundCount >= MIN_ROUNDS;
    const bgApiFn = isFinal
      ? (partial) => getClosingResponse([...apiHistory, { role: 'user', content: partial }], sourceText)
      : (partial) => getFollowUpResponse([...apiHistory, { role: 'user', content: partial }], sourceText);
    const ok = startListening({
      onInterim: (t) => { setCurrentAnswer(t); answerRef.current = t; },
      onFinal: (t) => { setCurrentAnswer(t); answerRef.current = t; },
      onError: () => {},
    });
    if (ok) {
      setIsRecording(true);
      startChunkedAnalysis({ apiFn: bgApiFn, getTranscript: () => answerRef.current });
      responseTimerRef.current = setInterval(() => {
        setResponseElapsed((e) => {
          if (e + 1 >= MAX_RESPONSE_SECONDS) handleStopRecording();
          return e + 1;
        });
      }, 1000);
    }
  };

  const handleStopRecording = () => {
    stopListening();
    setIsRecording(false);
    clearInterval(responseTimerRef.current);
    stopChunkedAnalysis();
    setTimeout(() => {
      const answer = (answerRef.current || currentAnswer).trim();
      if (answer) handleSubmitAnswer(answer);
    }, 500);
  };

  const handleSubmitAnswer = async (answer) => {
    if (!answer) return;
    setDisplayItems((prev) => [...prev, { type: 'message', role: 'student', text: answer }]);
    setCurrentAnswer('');
    setIsLoading(true);
    const newHistory = [...apiHistory, { role: 'user', content: answer }];
    const isFinalRound = roundCount >= MIN_ROUNDS;

    try {
      // Use cached background result if available, else fire fresh call
      const freshFn = isFinalRound
        ? (finalAnswer) => getClosingResponse([...apiHistory, { role: 'user', content: finalAnswer }], sourceText)
        : (finalAnswer) => getFollowUpResponse([...apiHistory, { role: 'user', content: finalAnswer }], sourceText);

      const result = await finishAnalysis({ freshFn, finalTranscript: answer });
      const updatedHistory = [...newHistory, { role: 'assistant', content: result.response }];
      setApiHistory(updatedHistory);
      setRoundCount((r) => r + 1);
      setIsLoading(false);
      addSupervisorResponse(result.response, result.internal_assessment || null, currentMode);

      if (isFinalRound || (roundCount >= MIN_ROUNDS - 1 && !result.should_continue)) {
        setTimeout(() => handleFinish(updatedHistory), 3000);
      }
    } catch (err) {
      console.error('Response failed:', err);
      setIsLoading(false);
      setDisplayItems((prev) => [...prev, { type: 'message', role: 'supervisor', text: "Good work today. Let's see your report." }]);
      setTimeout(() => handleFinish(newHistory), 2000);
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
      {/* LEFT: Transcript */}
      <section className="col-span-12 md:col-span-8 paper-card-elevated flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--rule-light)' }}>
          <div>
            <div className="label-caps" style={{ color: 'var(--oxblood)' }}>Viva in progress</div>
            <div className="serif font-semibold text-lg mt-0.5">{topic}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    background: n <= roundCount ? 'var(--gradient-indigo)' : 'var(--rule)',
                    opacity: n <= roundCount ? 1 : 0.3,
                    transform: n === roundCount ? 'scale(1.3)' : 'scale(1)',
                  }} />
              ))}
            </div>
            <div className="mono text-sm" style={{ color: 'var(--ink-muted)' }}>
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
            <div className="grid grid-cols-[90px_1fr] gap-5 animate-fade-in">
              <div className="label-caps pt-1.5" style={{ color: 'var(--indigo)' }}>Supervisor</div>
              <div className="supervisor-block p-4">
                <div className="flex gap-2"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
              </div>
            </div>)}
          {isFinishing && (
            <div className="text-center py-8 animate-fade-in">
              <div className="label-caps mb-2">Preparing report</div>
              <p className="serif text-lg" style={{ color: 'var(--ink-muted)' }}>Reviewing the full conversation...</p>
              <div className="mt-4 w-48 mx-auto h-1.5 rounded-full animate-shimmer" />
            </div>)}
          <div ref={scrollRef} />
        </div>

        {/* Input area */}
        {!isLoading && !isFinishing && (
          <div className="border-t px-6 py-6" style={{ borderColor: 'var(--rule-light)' }}>
            {currentAnswer ? (
              <div className="w-full rounded-xl border px-4 py-3 text-sm mb-4"
                style={{ borderColor: 'var(--rule)', background: 'var(--panel)' }}>{currentAnswer}</div>
            ) : !isRecording && (
              <p className="text-base text-center mb-4 font-medium" style={{ color: 'var(--ink-muted)' }}>
                Respond. Be precise.
              </p>
            )}

            {isRecording && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse-record" style={{ background: 'var(--oxblood)' }} />
                <span className="mono text-lg font-medium" style={{ color: 'var(--oxblood)' }}>
                  {Math.floor(responseElapsed / 60)}:{(responseElapsed % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-xs font-medium" style={{ color: MAX_RESPONSE_SECONDS - responseElapsed <= 10 ? 'var(--oxblood)' : 'var(--ink-faint)' }}>
                  {MAX_RESPONSE_SECONDS - responseElapsed}s left
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              {!isRecording && currentAnswer.trim() ? (
                <button onClick={() => handleSubmitAnswer((answerRef.current || currentAnswer).trim())}
                  className="record-btn w-16 h-16">
                  <ArrowRight className="w-7 h-7" />
                </button>
              ) : (
                <button onClick={isRecording ? handleStopRecording : handleStartRecording}
                  className={`record-btn w-16 h-16 ${isRecording ? 'record-btn--active' : ''}`}>
                  {isRecording ? <Square className="w-7 h-7 fill-white" /> : <Mic className="w-7 h-7" />}
                </button>
              )}
            </div>

            <div className="text-center mt-3">
              <span className="text-xs" style={{ color: 'var(--ink-faint)' }}>
                {isRecording ? 'Click to stop' : currentAnswer.trim() ? 'Click to submit' : 'Press R or click to record'}
              </span>
              {roundCount >= MIN_ROUNDS && !isRecording && (
                <button onClick={() => handleFinish()} className="block mx-auto mt-2 text-xs font-medium"
                  style={{ color: 'var(--indigo)' }}>
                  End tutorial & see report →
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* RIGHT: Dashboard */}
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
