/**
 * Chunked Analysis Service
 * 
 * Fires background analysis calls every CHUNK_INTERVAL seconds while
 * the user is recording. Each call gets progressively more transcript.
 * When the user stops, we either use the latest completed analysis
 * or fire one final call with the complete transcript.
 * 
 * This reduces perceived wait from ~50s to ~10-15s.
 */
import { analyzeExplanation } from '../api/claude';

const CHUNK_INTERVAL = 10_000; // 10 seconds

let intervalId = null;
let latestResult = null;
let latestTranscriptLength = 0;
let pendingCall = null;
let callCount = 0;

/**
 * Start firing background analysis calls as transcript accumulates.
 */
export function startChunkedAnalysis({ getTranscript, sourceText, confidenceBefore }) {
  stopChunkedAnalysis(); // clean up any previous run
  latestResult = null;
  latestTranscriptLength = 0;
  callCount = 0;

  intervalId = setInterval(async () => {
    const transcript = getTranscript();
    // Only fire if we have meaningful new content (at least 30 chars more)
    if (!transcript || transcript.length < 30) return;
    if (transcript.length - latestTranscriptLength < 20) return;

    callCount++;
    const callNum = callCount;
    const currentLength = transcript.length;

    console.log(`[Viva Chunked] Background analysis #${callNum} (${currentLength} chars)`);

    try {
      // Fire and forget — don't await, let it resolve in background
      pendingCall = analyzeExplanation(sourceText, transcript, confidenceBefore);
      const result = await pendingCall;

      // Only keep if this is still the latest (not superseded by a newer call)
      if (currentLength >= latestTranscriptLength) {
        latestResult = result;
        latestTranscriptLength = currentLength;
        console.log(`[Viva Chunked] Background #${callNum} complete, mode: ${result.routing_decision?.mode}`);
      }
    } catch (err) {
      console.warn(`[Viva Chunked] Background #${callNum} failed:`, err.message);
      // Non-fatal — we'll try again next interval or on final submit
    }
  }, CHUNK_INTERVAL);
}

/**
 * Stop the background interval.
 */
export function stopChunkedAnalysis() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * Called when user hits "Submit". Returns analysis as fast as possible.
 * 
 * Strategy:
 * - If we have a background result AND the transcript hasn't grown much since,
 *   use it immediately (0s wait).
 * - If transcript grew significantly since last background result,
 *   fire one final call with the complete transcript.
 * - If no background result at all, fire the full call (same as before).
 */
export async function finishAnalysis({ finalTranscript, sourceText, confidenceBefore }) {
  stopChunkedAnalysis();

  const newChars = finalTranscript.length - latestTranscriptLength;
  const growthRatio = latestTranscriptLength > 0 ? newChars / latestTranscriptLength : Infinity;

  console.log(`[Viva Chunked] Finishing. Latest result: ${latestResult ? 'yes' : 'no'}, new chars: ${newChars}, growth: ${(growthRatio * 100).toFixed(0)}%`);

  // If we have a recent result and transcript hasn't grown more than 30%
  if (latestResult && growthRatio < 0.3) {
    console.log('[Viva Chunked] Using cached background result (fast path!)');
    return latestResult;
  }

  // If we have a pending call that's almost done, wait for it
  if (pendingCall && growthRatio < 0.5) {
    try {
      console.log('[Viva Chunked] Waiting for pending background call...');
      const result = await Promise.race([
        pendingCall,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ]);
      return result;
    } catch {
      // Timed out or failed — fall through to fresh call
    }
  }

  // No usable background result — fire fresh call
  console.log('[Viva Chunked] No usable cache, firing fresh analysis...');
  return analyzeExplanation(sourceText, finalTranscript, confidenceBefore);
}

/**
 * Get the current background result (for UI status display).
 */
export function getLatestResult() {
  return latestResult;
}

export function getCallCount() {
  return callCount;
}
