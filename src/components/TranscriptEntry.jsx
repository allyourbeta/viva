/* ── Transcript-style message (supervisor or student) ── */
export default function TranscriptEntry({ role, text, thinking }) {
  const isSupervisor = role === 'supervisor';

  const modeLabels = {
    gap_fix: 'Fixing a gap',
    level_up: 'Pushing deeper',
    conflict_resolution: 'Resolving conflict',
    socratic_probe: 'Probing',
  };

  return (
    <div className={isSupervisor ? 'animate-slide-in-left' : 'animate-slide-in-right'}>
      {thinking && isSupervisor && (
        <div className="tutor-note px-4 py-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="label-caps">{modeLabels[thinking.mode] || 'Probing'}</div>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--ink-muted)' }}>
            {thinking.key_weakness_targeted}
          </p>
        </div>
      )}
      <div className="grid grid-cols-[90px_1fr] gap-5">
        <div className={`label-caps pt-2 ${isSupervisor ? '' : ''}`}
          style={{ color: isSupervisor ? 'var(--indigo)' : 'var(--ink-faint)' }}>
          {isSupervisor ? 'Supervisor' : 'Student'}
        </div>
        <div className={isSupervisor ? 'supervisor-block p-5' : 'student-block p-4'}>
          <p className={
            isSupervisor
              ? 'serif text-xl font-semibold leading-relaxed tracking-tight'
              : 'text-base leading-relaxed'
          } style={isSupervisor ? { color: 'var(--ink)' } : { color: 'var(--ink-muted)' }}>
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
