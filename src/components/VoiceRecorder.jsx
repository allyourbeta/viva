import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Square, Keyboard, Clock, ArrowRight } from 'lucide-react';
import useSessionStore from '../store/sessionStore';
import { isSupported, startListening, stopListening } from '../services/speechService';
import { startChunkedAnalysis, stopChunkedAnalysis, getCallCount } from '../services/chunkedAnalysis';
import { analyzeExplanation } from '../api/claude';

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

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

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
      startChunkedAnalysis({
        apiFn: (currentTranscript) => analyzeExplanation(sourceText, currentTranscript, confidenceBefore),
        getTranscript: () => transcriptRef.current,
      });
    }
  };

  const handleStopRecording = () => {
    stopListening();
    setIsRecording(false);
    setRecordingDuration(elapsed);
    stopChunkedAnalysis();
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
    setTimeout(() => handleSubmit(), 300);
  }, [elapsed]);

  const handleSubmit = async () => {
    const finalTranscript = showTextFallback ? textInput.trim() : (transcriptRef.current || transcript).trim();
    if (!finalTranscript) return;
    setTranscript(finalTranscript);
    stopChunkedAnalysis();
    setStep('tutorial');
  };

  const remaining = MAX_RECORDING_SECONDS - elapsed;
  const progress = elapsed / MAX_RECORDING_SECONDS;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* ── Header ── */}
      <div className="text-center mb-10">
        <div className="label-caps mb-2">Your turn</div>
        <h2 className="serif text-4xl font-bold tracking-tight">
          Explain: <span style={{ color: 'var(--indigo)' }}>{topic}</span>
        </h2>
        <p className="text-base mt-3" style={{ color: 'var(--ink-muted)' }}>
          Talk through what you know in under a minute. Be messy — that's the point.
        </p>
      </div>

      {!showTextFallback ? (
        <div className="flex flex-col items-center gap-8">
          {/* ── Record button with animated ring ── */}
          <div className="relative">
            {isRecording && (
              <>
                <div className="animate-ring-pulse" />
                <div className="animate-ring-pulse" style={{ animationDelay: '0.6s' }} />
              </>
            )}
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`record-btn w-32 h-32 ${isRecording ? 'record-btn--active' : ''}`}
            >
              {isRecording
                ? <Square className="w-12 h-12 fill-white" />
                : <Mic className="w-12 h-12" />}
            </button>
          </div>

          {/* ── Timer with progress arc ── */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="mono text-4xl font-medium"
                style={{ color: isRecording ? 'var(--oxblood)' : 'var(--ink-faint)' }}>
                {formatTime(elapsed)}
              </span>
              <span className="text-sm" style={{ color: 'var(--ink-faint)' }}> / 1:00</span>
            </div>
            {isRecording && (
              <div className="mt-3 w-64 mx-auto">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--rule)' }}>
                  <div className="h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{
                      width: `${progress * 100}%`,
                      background: remaining <= 10 ? 'var(--gradient-oxblood)' : 'var(--gradient-indigo)',
                    }} />
                </div>
                <p className="text-xs mt-1.5 font-medium"
                  style={{ color: remaining <= 10 ? 'var(--oxblood)' : 'var(--ink-faint)' }}>
                  {remaining}s remaining
                </p>
              </div>
            )}
            {!isRecording && !interimText && (
              <p className="text-sm mt-2" style={{ color: 'var(--ink-faint)' }}>
                Click to start recording
              </p>
            )}
          </div>

          {/* Background analysis indicator */}
          {isRecording && bgAnalysisCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full animate-fade-in"
              style={{ background: 'var(--indigo-bg)', color: 'var(--indigo)' }}>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Supervisor is already listening...</span>
            </div>
          )}

          {/* Live transcript */}
          {interimText && (
            <div className="w-full paper-card p-5 text-base leading-relaxed animate-fade-in"
              style={{ color: 'var(--ink-muted)' }}>
              {interimText}
            </div>
          )}

          {/* Mic fallback */}
          {!isRecording && (
            <button onClick={() => setShowTextFallback(true)}
              className="text-sm flex items-center gap-1 transition-opacity hover:opacity-70" style={{ color: 'var(--ink-faint)' }}>
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

      {/* Text fallback submit */}
      {!isRecording && showTextFallback && textInput.trim() && (
        <button onClick={handleSubmit}
          className="w-full mt-4 py-4 rounded-xl text-white text-lg font-semibold transition-all hover:scale-[1.01]"
          style={{ background: 'var(--gradient-indigo)', boxShadow: 'var(--glow-indigo)' }}>
          Submit to Your Supervisor <ArrowRight className="w-5 h-5 inline ml-2" />
        </button>
      )}
    </div>
  );
}
