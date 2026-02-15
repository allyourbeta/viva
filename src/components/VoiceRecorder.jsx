import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Keyboard, Clock } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { isSupported, startListening, stopListening } from '../services/speechService';
import { startChunkedAnalysis, stopChunkedAnalysis, getCallCount } from '../services/chunkedAnalysis';

const MAX_RECORDING_SECONDS = 60;

export default function VoiceRecorder() {
  const topic = useSessionStore((s) => s.topic);
  const sourceText = useSessionStore((s) => s.sourceText);
  const confidenceBefore = useSessionStore((s) => s.confidenceBefore);
  const isRecording = useSessionStore((s) => s.isRecording);
  const transcript = useSessionStore((s) => s.transcript);
  const setIsRecording = useSessionStore((s) => s.setIsRecording);
  const setTranscript = useSessionStore((s) => s.setTranscript);
  const setRecordingDuration = useSessionStore((s) => s.setRecordingDuration);
  const setStep = useSessionStore((s) => s.setStep);
  const setError = useSessionStore((s) => s.setError);

  const [showTextFallback, setShowTextFallback] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [interimText, setInterimText] = useState('');
  const [bgAnalysisCount, setBgAnalysisCount] = useState(0);
  const timerRef = useRef(null);
  const transcriptRef = useRef('');

  // Keep ref in sync with transcript for chunked analysis
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  // Timer + auto-stop at max duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          setBgAnalysisCount(getCallCount());
          if (next >= MAX_RECORDING_SECONDS) {
            handleStopAndSubmit();
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setElapsed(0);
    setTranscript('');
    setInterimText('');
    setBgAnalysisCount(0);
    transcriptRef.current = '';

    const started = startListening({
      onInterim: (text) => setInterimText(text),
      onFinal: (text) => {
        setTranscript(text);
        setInterimText(text);
        transcriptRef.current = text;
      },
      onError: (err) => {
        console.error('Speech error:', err);
        setError(`Mic issue: ${err}. Try the text fallback.`);
      },
    });

    if (started) {
      setIsRecording(true);
      // Start background chunked analysis
      startChunkedAnalysis({
        getTranscript: () => transcriptRef.current,
        sourceText,
        confidenceBefore,
      });
    }
  };

  const handleStopRecording = () => {
    stopListening();
    setIsRecording(false);
    setRecordingDuration(elapsed);
    stopChunkedAnalysis();
  };

  const handleStopAndSubmit = useCallback(() => {
    stopListening();
    setIsRecording(false);
    setRecordingDuration(elapsed);
    // Auto-submit after a brief moment for final transcript to settle
    setTimeout(() => handleSubmit(), 300);
  }, [elapsed]);

  const handleSubmit = async () => {
    const finalTranscript = showTextFallback ? textInput.trim() : (transcriptRef.current || transcript).trim();
    if (!finalTranscript) return;

    setTranscript(finalTranscript);
    stopChunkedAnalysis();
    setStep('tutorial');
  };

  const hasContent = showTextFallback ? textInput.trim().length > 0 : transcript.trim().length > 0;
  const remaining = MAX_RECORDING_SECONDS - elapsed;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-serif font-bold text-warm-900 mb-1">
          Explain: <span className="text-primary-600">{topic}</span>
        </h2>
        <p className="text-sm text-warm-500">
          Talk through what you know in under a minute. Be messy — that's the point.
        </p>
      </div>

      {!showTextFallback ? (
        <div className="flex flex-col items-center gap-6 py-8">
          {/* Record button */}
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse-record'
                : 'bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20'
            }`}
          >
            {isRecording ? (
              <Square className="w-8 h-8 text-white fill-white" />
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>

          {/* Timer with remaining time */}
          <div className="text-center">
            <span className={`font-mono text-2xl ${isRecording ? 'text-red-500' : 'text-warm-400'}`}>
              {formatTime(elapsed)}
            </span>
            {isRecording && (
              <p className={`text-xs mt-1 ${remaining <= 10 ? 'text-red-400' : 'text-warm-400'}`}>
                {remaining}s remaining
              </p>
            )}
          </div>

          {/* Background analysis indicator */}
          {isRecording && bgAnalysisCount > 0 && (
            <p className="text-xs text-primary-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Supervisor is already listening...
            </p>
          )}

          {/* Live transcript */}
          {interimText && (
            <div className="w-full max-h-32 overflow-y-auto text-sm text-warm-500 bg-warm-100 rounded-xl p-4 leading-relaxed">
              {interimText}
            </div>
          )}

          {/* Mic fallback */}
          {!isRecording && (
            <button
              onClick={() => setShowTextFallback(true)}
              className="text-xs text-warm-400 hover:text-warm-500 flex items-center gap-1"
            >
              <Keyboard className="w-3 h-3" /> Having mic issues? Type instead
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your explanation here..."
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-colors resize-none"
            autoFocus
          />
          <button
            onClick={() => setShowTextFallback(false)}
            className="text-xs text-warm-400 hover:text-warm-500 flex items-center gap-1"
          >
            <Mic className="w-3 h-3" /> Switch back to voice
          </button>
        </div>
      )}

      {/* Submit — only when stopped and has content */}
      {!isRecording && hasContent && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
        >
          Submit to Your Supervisor →
        </button>
      )}
    </div>
  );
}
