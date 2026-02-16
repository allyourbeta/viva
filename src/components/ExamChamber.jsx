import { useRef, useEffect } from 'react';
import { Mic, Square, ArrowRight } from 'lucide-react';
import { Trajectory, ConceptBoard } from './ExamDiagnostics';

const MODE_CONFIG = {
  gap_fix: { label: 'GAP FIX', warm: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' } },
  socratic_probe: { label: 'PROBING', warm: { color: '#d97706', bg: '#fffbeb', border: '#fed7aa' } },
  level_up: { label: 'LEVEL UP', warm: { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' } },
  conflict_resolution: { label: 'CONFLICT', warm: { color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' } },
};

export default function ExamChamber({
  topic,
  displayItems,
  assessments,
  currentMode,
  roundCount,
  elapsed,
  confidenceBefore,
  isLoading,
  isFinishing,
  isRecording,
  currentAnswer,
  responseElapsed,
  maxResponseSeconds,
  onStartRecording,
  onStopRecording,
  onSubmitAnswer,
  onFinish,
  minRounds,
}) {
  const mode = MODE_CONFIG[currentMode] || MODE_CONFIG.socratic_probe;
  const scrollRef = useRef(null);

  // Find latest examiner message for the big question
  const latestExaminer = [...displayItems].reverse().find((d) => d.role === 'supervisor');
  // Find latest student message
  const latestStudent = [...displayItems].reverse().find((d) => d.role === 'student');

  const mins = Math.floor(elapsed / 60);
  const secs = (elapsed % 60).toString().padStart(2, '0');

  // Latest assessment for sidebar
  const latestAssessment = assessments.length > 0 ? assessments[assessments.length - 1] : null;
  const confidenceScore = latestAssessment?.confidence_assessment;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayItems, isLoading]);

  return (
    <div className="exam-chamber-grid">
      {/* ═══ LEFT: The Examination Chamber ═══ */}
      <section className="exam-chamber-left">
        {/* Subtle grid */}
        <div className="exam-chamber-grid-bg" />
        {/* Mode-colored glow */}
        <div className="exam-chamber-glow" />

        {/* Top bar */}
        <div className="exam-chamber-header">
          <div className="flex items-center gap-3">
            <div className="exam-live-dot" />
            <span className="mono text-[9px] font-bold tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              EXAMINATION
            </span>
            <span className="mono text-[9px] font-bold tracking-[0.15em] px-2 py-0.5 rounded"
              style={{ color: mode.warm.color, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {mode.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="rounded-full transition-all duration-300"
                  style={{
                    width: n === roundCount ? 10 : 7,
                    height: n === roundCount ? 10 : 7,
                    background: n <= roundCount ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.12)',
                    boxShadow: n === roundCount ? '0 0 8px rgba(255,255,255,0.3)' : 'none',
                  }} />
              ))}
            </div>
            <span className="mono text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{mins}:{secs}</span>
          </div>
        </div>

        {/* ── THE QUESTION ── */}
        <div className="exam-chamber-question-area">
          {latestExaminer ? (
            <div key={displayItems.length} className="exam-question-animate">
              <p className="serif exam-question-text">
                {latestExaminer.text}
              </p>
            </div>
          ) : (
            <div className="text-center animate-fade-in">
              <p className="serif text-2xl font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Preparing your examination...
              </p>
            </div>
          )}

          {/* Student's last response — faded below */}
          {latestStudent && !isRecording && !currentAnswer && (
            <div className="exam-student-response animate-fade-in">
              <span className="mono text-[9px] tracking-[0.12em] uppercase"
                style={{ color: 'rgba(255,255,255,0.18)' }}>YOUR DEFENSE</span>
              <p className="text-sm mt-1 leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.25)', maxHeight: 80, overflow: 'hidden' }}>
                {latestStudent.text}
              </p>
            </div>
          )}
        </div>

        {/* Loading states */}
        {isLoading && !isFinishing && (
          <div className="text-center pb-4" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex gap-2 justify-center">
              <span className="typing-dot" style={{ background: 'rgba(255,255,255,0.5)' }} />
              <span className="typing-dot" style={{ background: 'rgba(255,255,255,0.5)' }} />
              <span className="typing-dot" style={{ background: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
        )}

        {isFinishing && (
          <div className="text-center pb-8 animate-fade-in" style={{ position: 'relative', zIndex: 1 }}>
            <div className="label-caps mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Preparing report</div>
            <div className="mt-3 w-48 mx-auto h-1.5 rounded-full animate-shimmer" />
          </div>
        )}

        {/* ── Input / Mic Area ── */}
        {!isLoading && !isFinishing && (
          <div className="exam-chamber-input">
            {/* Live transcript preview */}
            {currentAnswer && (
              <div className="exam-live-transcript">
                {currentAnswer}
              </div>
            )}

            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="w-2.5 h-2.5 rounded-full animate-pulse-record" style={{ background: '#ef4444' }} />
                <span className="mono text-lg font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {Math.floor(responseElapsed / 60)}:{(responseElapsed % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-xs font-medium"
                  style={{ color: maxResponseSeconds - responseElapsed <= 10 ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>
                  {maxResponseSeconds - responseElapsed}s left
                </span>
              </div>
            )}

            {/* Prompt text */}
            {!isRecording && !currentAnswer.trim() && (
              <p className="text-sm text-center mb-3 font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Respond. Be precise.
              </p>
            )}

            {/* Mic button */}
            <div className="flex items-center justify-center gap-4">
              {!isRecording && currentAnswer.trim() ? (
                <button onClick={onSubmitAnswer} className="record-btn w-14 h-14">
                  <ArrowRight className="w-6 h-6" />
                </button>
              ) : (
                <button
                  onClick={isRecording ? onStopRecording : onStartRecording}
                  className={`record-btn w-14 h-14 ${isRecording ? 'record-btn--active' : ''}`}
                  style={{ animation: !isRecording ? 'breatheMic 3s ease-in-out infinite' : undefined }}
                >
                  {isRecording ? <Square className="w-6 h-6 fill-white" /> : <Mic className="w-6 h-6" />}
                </button>
              )}
            </div>

            <div className="text-center mt-2">
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {isRecording ? 'Click to stop' : currentAnswer.trim() ? 'Click to submit' : 'Press R or click to record'}
              </span>
              {roundCount >= minRounds && !isRecording && (
                <button onClick={onFinish}
                  className="block mx-auto mt-2 text-xs font-medium"
                  style={{ color: 'rgba(255,255,255,0.4)' }}>
                  End examination & see report →
                </button>
              )}
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </section>

      {/* ═══ RIGHT: Warm Diagnostic Sidebar ═══ */}
      <aside className="exam-sidebar">
        {/* Mode banner */}
        <div className="exam-sidebar-banner"
          style={{ background: `linear-gradient(90deg, ${mode.warm.bg}, var(--surface))` }}>
          <div className="flex items-center gap-2">
            <span className="mono text-[10px] font-bold tracking-[0.12em] uppercase"
              style={{ color: mode.warm.color }}>{mode.label}</span>
            <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>·</span>
            <span className="serif text-sm font-semibold" style={{ color: 'var(--ink)' }}>{topic}</span>
          </div>
        </div>

        <div className="exam-sidebar-content">
          {/* Big confidence score */}
          <div className="paper-card p-4 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] transition-colors duration-400"
              style={{ background: `linear-gradient(90deg, ${mode.warm.color}, ${mode.warm.color}80)` }} />
            <div className="mono font-extrabold leading-none transition-colors duration-400"
              style={{
                fontSize: 52,
                color: confidenceScore >= 7 ? 'var(--sage)' : confidenceScore >= 5 ? 'var(--amber-accent)' : 'var(--oxblood)',
              }}>
              {confidenceScore ?? '—'}
              <span className="text-xl" style={{ color: 'var(--ink-faint)' }}>/10</span>
            </div>
            <div className="label-caps mt-1">Assessed Understanding</div>

            {/* Nailed tags */}
            {latestAssessment?.what_they_nailed?.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-3">
                {latestAssessment.what_they_nailed.map((n, j) => (
                  <span key={j} className="text-[10px] px-2 py-0.5 rounded font-semibold"
                    style={{ background: 'var(--sage-bg)', color: 'var(--sage)', border: '1px solid #a7f3d0' }}>
                    ✓ {n}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Targeting */}
          <div className="rounded-2xl p-4 transition-colors duration-400"
            style={{ background: mode.warm.bg, border: `1px solid ${mode.warm.border}` }}>
            <div className="label-caps mb-1.5" style={{ color: mode.warm.color }}>NOW TARGETING</div>
            <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--ink)' }}>
              {latestAssessment?.key_weakness_targeted || 'Analyzing your explanation...'}
            </p>
          </div>

          {/* Trajectory */}
          <div className="paper-card p-4">
            <div className="label-caps mb-2">Pressure Trajectory</div>
            <Trajectory assessments={displayItems.filter((d) => d.role === 'supervisor')} />
            {assessments.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Waiting for first exchange...</p>
            )}
          </div>

          {/* Concepts */}
          <div className="paper-card p-4">
            <div className="label-caps mb-2">Concepts</div>
            <ConceptBoard assessments={displayItems.filter((d) => d.role === 'supervisor')} />
            {assessments.length === 0 && (
              <p className="text-xs" style={{ color: 'var(--ink-faint)' }}>Will populate as you discuss...</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
