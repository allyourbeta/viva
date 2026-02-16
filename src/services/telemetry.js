/**
 * Telemetry Event Bus
 * 
 * Lightweight pub/sub for the Architecture X-Ray overlay.
 * Components and services emit events; the XRay panel subscribes.
 * Zero overhead when no subscribers — events just drop.
 * 
 * Event types:
 *   chunk_start    — Background pre-call fired
 *   chunk_complete — Background pre-call returned
 *   chunk_cached   — Used cached result (fast path)
 *   api_call       — Any API call (opening, followup, closing, wrapup)
 *   api_complete   — API call finished with timing
 *   routing        — Mode changed (gap_fix, level_up, etc.)
 *   assessment     — Internal assessment JSON received
 *   speech_start   — TTS started speaking
 *   speech_end     — TTS finished
 *   listening      — STT active
 */

const listeners = new Set();
const eventLog = [];
const MAX_LOG = 100;

export function emit(type, data = {}) {
  const event = {
    type,
    timestamp: Date.now(),
    ...data,
  };
  eventLog.push(event);
  if (eventLog.length > MAX_LOG) eventLog.shift();
  listeners.forEach((fn) => fn(event));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getLog() {
  return [...eventLog];
}

export function clearLog() {
  eventLog.length = 0;
}
