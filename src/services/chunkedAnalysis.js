/**
 * Chunked Background Pre-caller
 * 
 * Fires background API calls every CHUNK_INTERVAL ms while the user is
 * recording. Works for ANY async function — initial analysis, follow-ups, etc.
 * 
 * Each call gets progressively more transcript. When the user stops,
 * we either use the latest completed result or fire one final call.
 */

const CHUNK_INTERVAL = 5_000; // 5 seconds

let intervalId = null;
let latestResult = null;
let latestTranscriptLength = 0;
let pendingCall = null;
let callCount = 0;
let activeFn = null;

/**
 * Start firing background calls as transcript accumulates.
 * @param {function} apiFn - Called with (currentTranscript). Must return a promise.
 * @param {function} getTranscript - Returns current transcript string.
 */
export function startChunkedAnalysis({ apiFn, getTranscript }) {
  stopChunkedAnalysis();
  latestResult = null;
  latestTranscriptLength = 0;
  callCount = 0;
  activeFn = apiFn;

  intervalId = setInterval(async () => {
    const transcript = getTranscript();
    if (!transcript || transcript.length < 30) return;
    if (transcript.length - latestTranscriptLength < 20) return;

    callCount++;
    const callNum = callCount;
    const currentLength = transcript.length;

    console.log(`[Viva Chunked] Background #${callNum} (${currentLength} chars)`);

    try {
      pendingCall = activeFn(transcript);
      const result = await pendingCall;

      if (currentLength >= latestTranscriptLength) {
        latestResult = result;
        latestTranscriptLength = currentLength;
        console.log(`[Viva Chunked] Background #${callNum} complete`);
      }
    } catch (err) {
      console.warn(`[Viva Chunked] Background #${callNum} failed:`, err.message);
    }
  }, CHUNK_INTERVAL);
}

/** Stop the background interval. */
export function stopChunkedAnalysis() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/**
 * Called when user stops recording. Returns result as fast as possible.
 * @param {function} freshFn - Called with (finalTranscript) if no cache is usable.
 * @param {string} finalTranscript - The complete transcript.
 */
export async function finishAnalysis({ freshFn, finalTranscript }) {
  stopChunkedAnalysis();

  const fn = freshFn || activeFn;
  const newChars = finalTranscript.length - latestTranscriptLength;
  const growthRatio = latestTranscriptLength > 0 ? newChars / latestTranscriptLength : Infinity;

  console.log(`[Viva Chunked] Finishing. Cached: ${latestResult ? 'yes' : 'no'}, new chars: ${newChars}, growth: ${(growthRatio * 100).toFixed(0)}%`);

  if (latestResult && growthRatio < 0.3) {
    console.log('[Viva Chunked] Using cached result (fast path!)');
    return latestResult;
  }

  if (pendingCall && growthRatio < 0.5) {
    try {
      console.log('[Viva Chunked] Waiting for pending call...');
      const result = await Promise.race([
        pendingCall,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ]);
      return result;
    } catch {
      // Fall through
    }
  }

  console.log('[Viva Chunked] No cache, firing fresh call...');
  return fn(finalTranscript);
}

export function getLatestResult() { return latestResult; }
export function getCallCount() { return callCount; }
