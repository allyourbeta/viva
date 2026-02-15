/**
 * Web Speech API wrapper for voice recording and TTS.
 * Chrome-only for hackathon. Provides start/stop/callback interface.
 */

let recognition = null;
let isListening = false;

// --- TTS Voice Preloading ---
const PREFERRED_VOICES = [
  'Samantha',
  'Google UK English Female',
  'Google US English',
];

let cachedVoice = null;

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  for (const name of PREFERRED_VOICES) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }
  // Fallback: first English voice, or first voice overall
  return (
    voices.find((v) => v.lang.startsWith('en')) || voices[0]
  );
}

/**
 * Preload voices early so they're ready when speak() is called.
 * Call this on app mount (e.g. in App.jsx useEffect).
 */
export function preloadVoices() {
  if (!window.speechSynthesis) return;
  cachedVoice = pickVoice();
  if (!cachedVoice) {
    speechSynthesis.onvoiceschanged = () => {
      cachedVoice = pickVoice();
    };
  }
}

// --- Speech Recognition ---

export function isSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startListening({ onInterim, onFinal, onError, onEnd, lang = 'en-US' }) {
  if (!isSupported()) {
    onError?.('Speech recognition is not supported in this browser. Please use Chrome.');
    return false;
  }

  stopListening();

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

// --- TTS ---

/**
 * Speak text aloud using browser TTS.
 * Always cancels previous speech. Waits for voices if not yet loaded.
 */
export function speak(text, { rate = 0.95, pitch = 1.0, onEnd } = {}) {
  if (!window.speechSynthesis) return;

  // Always cancel previous utterance
  speechSynthesis.cancel();

  const doSpeak = (voice) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    if (voice) utterance.voice = voice;
    if (onEnd) utterance.onend = onEnd;
    speechSynthesis.speak(utterance);
  };

  // If we already have a cached voice, use it
  if (cachedVoice) {
    doSpeak(cachedVoice);
    return;
  }

  // Voices not loaded yet — wait for them
  const voices = speechSynthesis.getVoices();
  if (voices.length) {
    cachedVoice = pickVoice();
    doSpeak(cachedVoice);
  } else {
    speechSynthesis.onvoiceschanged = () => {
      cachedVoice = pickVoice();
      doSpeak(cachedVoice);
    };
  }
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
