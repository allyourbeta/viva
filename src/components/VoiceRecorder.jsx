import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Keyboard, Clock, ArrowRight } from 'lucide-react';
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
    // Auto-submit after brief pause for final transcript to settle
    setTimeout(() => {
      const finalTranscript = (transcriptRef.current || transcript).trim();
      if (finalTranscript) {
        setTranscript(finalTranscript);
        setStep('tutorial');
      }
    }, 500);
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="serif text-3xl font-semibold tracking-tight">
          Explain: <span style={{ color: 'var(--indigo)' }}>{topic}</span>
        </h2>
        <p className="text-base mt-2" style={{ color: 'var(--ink-muted)' }}>
          Talk through what you know in under a minute. Be messy — that's the point.
        </p>
      </div>

      {!showTextFallback ? (
        <div className="flex flex-col items-center gap-6">
          {/* Record button */}
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className="w-28 h-28 rounded-full flex items-center justify-center transition-all shadow-lg"
            style={{
              background: isRecording ? 'var(--oxblood)' : 'var(--indigo)',
            }}
          >
            {isRecording
              ? <Square className="w-10 h-10 text-white fill-white" />
              : <Mic className="w-10 h-10 text-white" />}
          </button>

          {/* Timer */}
          <div className="text-center">
            <span className="font-mono text-3xl" style={{ color: isRecording ? 'var(--oxblood)' : 'var(--ink-faint)' }}>
              {formatTime(elapsed)}
            </span>
            {isRecording && (
              <p className="text-sm mt-1" style={{ color: remaining <= 10 ? 'var(--oxblood)' : 'var(--ink-faint)' }}>
                {remaining}s remaining
              </p>
            )}
          </div>

          {/* Background analysis indicator */}
          {isRecording && bgAnalysisCount > 0 && (
            <p className="text-sm flex items-center gap-1" style={{ color: 'var(--indigo)' }}>
              <Clock className="w-4 h-4" />
              Supervisor is already listening...
            </p>
          )}

          {/* Live transcript */}
          {interimText && (
            <div className="w-full rounded-xl p-5 text-base leading-relaxed"
              style={{ background: 'var(--surface)', border: '1px solid var(--rule)', color: 'var(--ink-muted)' }}>
              {interimText}
            </div>
          )}

          {/* Mic fallback */}
          {!isRecording && (
            <button onClick={() => setShowTextFallback(true)}
              className="text-sm flex items-center gap-1" style={{ color: 'var(--ink-faint)' }}>
              <Keyboard className="w-4 h-4" /> Having mic issues? Type instead
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your explanation here..." rows={6}
            className="w-full px-5 py-4 rounded-xl text-base resize-none"
            style={{ border: '1px solid var(--rule)', background: 'var(--surface)', color: 'var(--ink)' }}
            autoFocus />
          <button onClick={() => setShowTextFallback(false)}
            className="text-sm flex items-center gap-1" style={{ color: 'var(--ink-faint)' }}>
            <Mic className="w-4 h-4" /> Switch back to voice
          </button>
        </div>
      )}

      {/* Text fallback still needs a submit button */}
      {!isRecording && showTextFallback && textInput.trim() && (
        <button onClick={handleSubmit}
          className="w-full py-4 rounded-xl text-white text-lg font-semibold transition-transform hover:scale-[1.01]"
          style={{ background: 'var(--indigo)' }}>
          Submit to Your Supervisor →
        </button>
      )}
    </div>
  );
}
