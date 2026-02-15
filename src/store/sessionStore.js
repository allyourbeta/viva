import { create } from 'zustand';

const STEPS = ['source', 'confidence', 'recording', 'tutorial', 'card'];

const initialSessionState = {
  step: 'source',
  topic: '',
  sourceUrl: '',
  sourceText: '',
  sourceWasAutoSearched: false,
  confidenceBefore: 5,
  isRecording: false,
  transcript: '',
  recordingDuration: 0,
  analysis: null,
  routingMode: null,
  routingRationale: '',
  routingPlan: [],
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  learningCard: null,
  isLoading: false,
  error: null,
};

const useSessionStore = create((set, get) => ({
  ...initialSessionState,
  sessions: [],

  // Navigation
  setStep: (step) => set({ step }),
  nextStep: () => {
    const current = get().step;
    const idx = STEPS.indexOf(current);
    if (idx < STEPS.length - 1) set({ step: STEPS[idx + 1] });
  },

  // Source input
  setTopic: (topic) => set({ topic }),
  setSourceUrl: (sourceUrl) => set({ sourceUrl }),
  setSourceText: (sourceText) => set({ sourceText }),
  setSourceWasAutoSearched: (v) => set({ sourceWasAutoSearched: v }),

  // Confidence
  setConfidenceBefore: (confidenceBefore) => set({ confidenceBefore }),

  // Recording
  setIsRecording: (isRecording) => set({ isRecording }),
  setTranscript: (transcript) => set({ transcript }),
  appendTranscript: (text) => set((s) => ({ transcript: s.transcript + ' ' + text })),
  setRecordingDuration: (recordingDuration) => set({ recordingDuration }),

  // Analysis
  setAnalysis: (analysis) => set({ analysis }),
  setRouting: (mode, rationale, plan) => set({
    routingMode: mode,
    routingRationale: rationale,
    routingPlan: plan,
  }),

  // Socratic
  setQuestions: (questions) => set({ questions }),
  setCurrentQuestionIndex: (i) => set({ currentQuestionIndex: i }),
  addAnswer: (answer) => set((s) => ({ answers: [...s.answers, answer] })),

  // Learning card
  setLearningCard: (learningCard) => set({ learningCard }),

  // Loading / error
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Session history
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((s) => ({ sessions: [session, ...s.sessions] })),

  // Reset for new session
  resetSession: () => set({ ...initialSessionState }),
}));

export default useSessionStore;
