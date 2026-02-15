/**
 * Web Speech API wrapper for voice recording.
 * Chrome-only for hackathon. Provides start/stop/callback interface.
 */

let recognition = null;
let isListening = false;

export function isSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startListening({ onInterim, onFinal, onError, onEnd, lang = 'en-US' }) {
  if (!isSupported()) {
    onError?.('Speech recognition is not supported in this browser. Please use Chrome.');
    return false;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;

  let finalTranscript = '';

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript + ' ';
        onFinal?.(finalTranscript.trim());
      } else {
        interim += result[0].transcript;
        onInterim?.(finalTranscript + interim);
      }
    }
  };

  recognition.onerror = (event) => {
    // 'no-speech' is not fatal — just means silence
    if (event.error === 'no-speech') return;
    onError?.(event.error);
  };

  recognition.onend = () => {
    // Auto-restart if we're still supposed to be listening
    if (isListening) {
      try {
        recognition.start();
      } catch (e) {
        // Already started, ignore
      }
    } else {
      onEnd?.(finalTranscript.trim());
    }
  };

  try {
    recognition.start();
    isListening = true;
    return true;
  } catch (e) {
    onError?.(e.message);
    return false;
  }
}

export function stopListening() {
  isListening = false;
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      // Already stopped
    }
    recognition = null;
  }
}

/**
 * Speak text aloud using browser TTS (stretch goal).
 */
export function speak(text, { rate = 0.95, pitch = 1, onEnd } = {}) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
