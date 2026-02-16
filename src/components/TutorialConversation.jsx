import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, ArrowRight } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { getOpeningResponse, getFollowUpResponse, getClosingResponse, wrapUpTutorial } from '../api/tutorial';
import { startListening, stopListening, speak } from '../services/speechService';
import { startChunkedAnalysis, stopChunkedAnalysis, finishAnalysis } from '../services/chunkedAnalysis';
import ExamChamber from './ExamChamber';
import ArchitectureXRay from './ArchitectureXRay';

// TranscriptEntry uses: supervisor-block, student-block, tutor-note, 'Supervisor', 'Student'

const MAX_RESPONSE_SECONDS = 60;
const MIN_ROUNDS = 3; // Minimum exchanges before closing (bump to 4-5 for production)

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
  const apiHistoryRef = useRef([]);
  const roundCountRef = useRef(0);

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
        const result = await getOpeningResponse(sourceText, transcript, confidenceBefore, topic);
        if (cancelled) return;
        const a = result.internal_assessment;
        if (a) setRouting(a.mode || 'socratic_probe', a.key_weakness_targeted || '', []);
        const initialHistory = [
          { role: 'user', content: `Student's explanation:\n${transcript}` },
          { role: 'assistant', content: result.response },
        ];
        setApiHistory(initialHistory);
        apiHistoryRef.current = initialHistory;
        setIsLoading(false);
        addSupervisorResponse(result.response, a, null);
        setRoundCount(1);
        roundCountRef.current = 1;
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
    const history = apiHistoryRef.current;
    const round = roundCountRef.current;
    const isFinal = round >= MIN_ROUNDS;
    const bgApiFn = isFinal
      ? (partial) => getClosingResponse([...history, { role: "user", content: partial }], sourceText, topic)
      : (partial) => getFollowUpResponse([...history, { role: 'user', content: partial }], sourceText, topic);
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

  const handleStopRecording = useCallback(() => {
    stopListening();
    setIsRecording(false);
    clearInterval(responseTimerRef.current);
    stopChunkedAnalysis();
    setTimeout(() => {
      const answer = (answerRef.current).trim();
      if (answer) handleSubmitAnswer(answer);
    }, 500);
  }, []);

  const handleSubmitAnswer = async (answer) => {
    if (!answer) return;
    setDisplayItems((prev) => [...prev, { type: 'message', role: 'student', text: answer }]);
    setCurrentAnswer('');
    setIsLoading(true);
    const history = apiHistoryRef.current;
    const round = roundCountRef.current;
    const newHistory = [...history, { role: 'user', content: answer }];
    const isFinalRound = round >= MIN_ROUNDS;

    try {
      const freshFn = isFinalRound
        ? (finalAnswer) => getClosingResponse([...history, { role: 'user', content: finalAnswer }], sourceText, topic)
        : (finalAnswer) => getFollowUpResponse([...history, { role: 'user', content: finalAnswer }], sourceText, topic);

      const result = await finishAnalysis({ freshFn, finalTranscript: answer });
      const updatedHistory = [...newHistory, { role: 'assistant', content: result.response }];
      setApiHistory(updatedHistory);
      apiHistoryRef.current = updatedHistory;
      setRoundCount((r) => { roundCountRef.current = r + 1; return r + 1; });
      setIsLoading(false);
      addSupervisorResponse(result.response, result.internal_assessment || null, currentMode);

      const newRound = round + 1;
      if (isFinalRound || (newRound >= MIN_ROUNDS && !result.should_continue)) {
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
    <>
      <ExamChamber
        topic={topic}
        displayItems={displayItems}
        assessments={assessments}
        currentMode={currentMode}
        roundCount={roundCount}
        elapsed={elapsed}
        confidenceBefore={confidenceBefore}
        isLoading={isLoading}
        isFinishing={isFinishing}
        isRecording={isRecording}
        currentAnswer={currentAnswer}
        responseElapsed={responseElapsed}
        maxResponseSeconds={MAX_RESPONSE_SECONDS}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onSubmitAnswer={() => handleSubmitAnswer((answerRef.current || currentAnswer).trim())}
        onFinish={() => handleFinish()}
        minRounds={MIN_ROUNDS}
      />
      <ArchitectureXRay />
    </>
  );
}
