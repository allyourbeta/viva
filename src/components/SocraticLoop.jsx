import { useState } from 'react';
import { Mic, Square, Send, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { evaluateAnswer } from '../api/claude';
import { startListening, stopListening } from '../services/speechService';
import { generateLearningCard } from '../api/claude';

export default function SocraticLoop() {
  const questions = useSessionStore((s) => s.questions);
  const currentQuestionIndex = useSessionStore((s) => s.currentQuestionIndex);
  const setCurrentQuestionIndex = useSessionStore((s) => s.setCurrentQuestionIndex);
  const answers = useSessionStore((s) => s.answers);
  const addAnswer = useSessionStore((s) => s.addAnswer);
  const sourceText = useSessionStore((s) => s.sourceText);
  const analysis = useSessionStore((s) => s.analysis);
  const topic = useSessionStore((s) => s.topic);
  const setLearningCard = useSessionStore((s) => s.setLearningCard);
  const setStep = useSessionStore((s) => s.setStep);

  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState(null);

  const question = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;
  const isComplete = currentQuestionIndex >= questions.length;

  const intentLabels = {
    fix_misconception: 'Fix misconception',
    deepen_understanding: 'Deepen understanding',
    test_transfer: 'Test transfer',
    connect_concepts: 'Connect concepts',
  };

  const handleStartRecording = () => {
    setCurrentTranscript('');
    setLastEvaluation(null);
    const started = startListening({
      onInterim: (text) => setCurrentTranscript(text),
      onFinal: (text) => setCurrentTranscript(text),
      onError: (err) => console.error('Speech error:', err),
    });
    if (started) setIsRecording(true);
  };

  const handleStopRecording = () => {
    stopListening();
    setIsRecording(false);
  };

  const handleSubmitAnswer = async () => {
    if (!currentTranscript.trim()) return;
    setIsEvaluating(true);

    try {
      const evaluation = await evaluateAnswer(question, currentTranscript.trim(), sourceText);
      const answerRecord = {
        questionIndex: currentQuestionIndex,
        transcript: currentTranscript.trim(),
        ...evaluation,
      };
      addAnswer(answerRecord);
      setLastEvaluation(evaluation);
    } catch (err) {
      console.error('Evaluation failed:', err);
      const fallback = {
        questionIndex: currentQuestionIndex,
        transcript: currentTranscript.trim(),
        gap_closed: false,
        evaluation: 'Could not evaluate — moving on.',
        correction: null,
        follow_up_needed: false,
      };
      addAnswer(fallback);
      setLastEvaluation(fallback);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    setCurrentTranscript('');
    setLastEvaluation(null);
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  const handleFinishSession = async () => {
    setStep('analyzing');
    try {
      const card = await generateLearningCard(analysis, questions, answers, topic);
      setLearningCard(card);
      setStep('card');
    } catch (err) {
      console.error('Card generation failed:', err);
      setLearningCard({
        confidence_after: null,
        concepts_mastered: [],
        remaining_gaps: [],
        key_correction: null,
        one_thing_to_remember: 'Card generation failed — but you still completed the session!',
        meta_learning_insight: null,
        next_session_seed: null,
      });
      setStep('card');
    }
  };

  if (isComplete || !question) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <h2 className="text-xl font-serif font-bold text-warm-900 mb-2">Tutorial Complete</h2>
        <p className="text-sm text-warm-500 mb-6">Your supervisor is preparing your session card.</p>
        <button
          onClick={handleFinishSession}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          View Learning Card →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-serif font-bold text-warm-900">
          Question {currentQuestionIndex + 1} of {questions.length}
        </h2>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-50 text-primary-700">
          {intentLabels[question.intent] || question.intent}
        </span>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl border border-warm-200 p-5">
        <p className="text-warm-800 leading-relaxed">{question.question}</p>
        {question.target_gap && (
          <p className="text-xs text-warm-400 mt-2">
            Targeting: {question.target_gap}
          </p>
        )}
      </div>

      {/* Answer area */}
      {!lastEvaluation && (
        <div className="flex flex-col items-center gap-4 py-4">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse-record'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {isRecording ? (
              <Square className="w-5 h-5 text-white fill-white" />
            ) : (
              <Mic className="w-5 h-5 text-white" />
            )}
          </button>

          {currentTranscript && (
            <div className="w-full text-sm text-warm-500 bg-warm-100 rounded-xl p-4 leading-relaxed">
              {currentTranscript}
            </div>
          )}

          {!isRecording && currentTranscript.trim() && (
            <button
              onClick={handleSubmitAnswer}
              disabled={isEvaluating}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-warm-300 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              {isEvaluating ? 'Evaluating...' : <><Send className="w-4 h-4" /> Submit Answer</>}
            </button>
          )}
        </div>
      )}

      {/* Evaluation result */}
      {lastEvaluation && (
        <div className="space-y-3 animate-fade-in">
          <div className={`rounded-xl p-4 border ${
            lastEvaluation.gap_closed
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-start gap-2">
              {lastEvaluation.gap_closed ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm text-warm-800 leading-relaxed">
                  {lastEvaluation.evaluation}
                </p>
                {lastEvaluation.correction && (
                  <p className="text-sm text-warm-600 mt-2 leading-relaxed">
                    <strong>Correction:</strong> {lastEvaluation.correction}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Next or finish */}
          <button
            onClick={isLastQuestion ? handleFinishSession : handleNextQuestion}
            className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isLastQuestion ? 'Finish Session →' : <>Next Question <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      )}
    </div>
  );
}
