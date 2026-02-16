import { useState, useEffect, useRef } from 'react';
import { Activity, Cpu, Zap, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { subscribe, getLog } from '../services/telemetry';

const MODE_COLORS = {
  gap_fix: { bg: 'var(--amber-bg)', color: 'var(--amber-accent)', label: 'GAP FIX' },
  socratic_probe: { bg: 'var(--indigo-bg)', color: 'var(--indigo)', label: 'PROBING' },
  level_up: { bg: 'var(--sage-bg)', color: 'var(--sage)', label: 'LEVEL UP' },
  conflict_resolution: { bg: 'var(--oxblood-bg)', color: 'var(--oxblood)', label: 'CONFLICT' },
};

const ENDPOINT_LABELS = {
  opening: 'Opening Analysis',
  followup: 'Follow-up',
  closing: 'Closing Verdict',
  wrapup: 'Learning Card Gen',
};

function EventLine({ event }) {
  const age = ((Date.now() - event.timestamp) / 1000).toFixed(0);

  if (event.type === 'api_call') {
    return (
      <div className="xray-event xray-event--api-call">
        <span className="xray-dot xray-dot--pending" />
        <span className="xray-label">API</span>
        <span className="xray-text">
          {ENDPOINT_LABELS[event.endpoint] || event.endpoint}
          <span className="xray-model">{event.model}</span>
        </span>
        <span className="xray-age">{age}s ago</span>
      </div>
    );
  }

  if (event.type === 'api_complete') {
    return (
      <div className="xray-event xray-event--api-done">
        <span className="xray-dot xray-dot--success" />
        <span className="xray-label">DONE</span>
        <span className="xray-text">
          {ENDPOINT_LABELS[event.endpoint] || event.endpoint}
          <span className="xray-timing">{(event.ms / 1000).toFixed(1)}s</span>
        </span>
        <span className="xray-age">{age}s ago</span>
      </div>
    );
  }

  if (event.type === 'chunk_start') {
    return (
      <div className="xray-event xray-event--chunk">
        <span className="xray-dot xray-dot--chunk" />
        <span className="xray-label">PRE</span>
        <span className="xray-text">
          Background #{event.callNum}
          <span className="xray-chars">{event.chars} chars</span>
        </span>
        <span className="xray-age">{age}s ago</span>
      </div>
    );
  }

  if (event.type === 'chunk_complete') {
    return (
      <div className="xray-event xray-event--chunk-done">
        <span className="xray-dot xray-dot--success" />
        <span className="xray-label">CACHED</span>
        <span className="xray-text">
          Pre-call #{event.callNum} ready
          <span className="xray-chars">{event.chars} chars</span>
        </span>
        <span className="xray-age">{age}s ago</span>
      </div>
    );
  }

  if (event.type === 'chunk_cached') {
    return (
      <div className="xray-event xray-event--fast">
        <Zap className="w-3 h-3" style={{ color: 'var(--sage)' }} />
        <span className="xray-label xray-label--fast">FAST</span>
        <span className="xray-text">
          Used cached result — skipped API call
          <span className="xray-chars">+{event.newChars} new chars ({event.growthPercent}%)</span>
        </span>
        <span className="xray-age">{age}s ago</span>
      </div>
    );
  }

  if (event.type === 'assessment') {
    const a = event.assessment;
    const modeStyle = MODE_COLORS[a.mode] || MODE_COLORS.socratic_probe;
    return (
      <div className="xray-event xray-event--assessment">
        <span className="xray-dot" style={{ background: modeStyle.color }} />
        <span className="xray-label">EVAL</span>
        <div className="xray-assessment-body">
          <div className="xray-mode-badge" style={{ background: modeStyle.bg, color: modeStyle.color }}>
            {modeStyle.label}
          </div>
          {a.what_they_nailed?.length > 0 && (
            <div className="xray-nailed">
              {a.what_they_nailed.map((p, i) => (
                <span key={i} className="xray-concept-tag xray-concept-tag--good">{p}</span>
              ))}
            </div>
          )}
          {a.key_weakness_targeted && (
            <div className="xray-weakness">
              <span className="xray-weakness-arrow">→</span> {a.key_weakness_targeted}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (event.type === 'routing') {
    const modeStyle = MODE_COLORS[event.mode] || MODE_COLORS.socratic_probe;
    return (
      <div className="xray-event xray-event--routing">
        <Activity className="w-3 h-3" style={{ color: modeStyle.color }} />
        <span className="xray-label">MODE</span>
        <span className="xray-text">
          Switched to <span className="xray-mode-badge" style={{ background: modeStyle.bg, color: modeStyle.color }}>
            {modeStyle.label}
          </span>
        </span>
      </div>
    );
  }

  return null;
}

export default function ArchitectureXRay() {
  const [events, setEvents] = useState(getLog);
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef(null);
  const [apiCalls, setApiCalls] = useState(0);
  const [avgLatency, setAvgLatency] = useState(0);
  const [cachedHits, setCachedHits] = useState(0);

  useEffect(() => {
    const unsub = subscribe((event) => {
      setEvents((prev) => [...prev.slice(-60), event]);

      if (event.type === 'api_call') setApiCalls((c) => c + 1);
      if (event.type === 'chunk_cached') setCachedHits((c) => c + 1);
      if (event.type === 'api_complete') {
        setAvgLatency((prev) => prev === 0 ? event.ms : Math.round((prev + event.ms) / 2));
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="xray-toggle" title="Show Architecture X-Ray">
        <Cpu className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className={`xray-panel ${isMinimized ? 'xray-panel--mini' : ''}`}>
      {/* Header */}
      <div className="xray-header">
        <div className="xray-header-left">
          <Cpu className="w-3.5 h-3.5" />
          <span className="xray-title">ARCHITECTURE X-RAY</span>
          <span className="xray-live-dot" />
        </div>
        <div className="xray-header-right">
          <button onClick={() => setIsMinimized(!isMinimized)} className="xray-header-btn">
            {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="xray-header-btn">
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Stats bar */}
          <div className="xray-stats">
            <div className="xray-stat">
              <span className="xray-stat-value">{apiCalls}</span>
              <span className="xray-stat-label">API calls</span>
            </div>
            <div className="xray-stat">
              <span className="xray-stat-value">{avgLatency > 0 ? `${(avgLatency / 1000).toFixed(1)}s` : '—'}</span>
              <span className="xray-stat-label">avg latency</span>
            </div>
            <div className="xray-stat">
              <span className="xray-stat-value">{cachedHits}</span>
              <span className="xray-stat-label">cache hits</span>
            </div>
            <div className="xray-stat">
              <span className="xray-stat-value xray-stat-value--model">Opus 4.6</span>
              <span className="xray-stat-label">model</span>
            </div>
          </div>

          {/* Event feed */}
          <div className="xray-feed" ref={scrollRef}>
            {events.length === 0 ? (
              <div className="xray-empty">
                <Activity className="w-4 h-4 opacity-30" />
                <span>Waiting for events...</span>
              </div>
            ) : (
              events.map((e, i) => <EventLine key={`${e.timestamp}-${i}`} event={e} />)
            )}
          </div>

          {/* Footer */}
          <div className="xray-footer">
            <span>Chunked pre-calling · Adaptive routing · Structured JSON output</span>
          </div>
        </>
      )}
    </div>
  );
}
