/**
 * Tier 2: Component Smoke Tests (updated for new tutorial flow)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockStore = {
  step: 'source',
  topic: 'test topic',
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
  sessions: [],
  setStep: vi.fn(),
  nextStep: vi.fn(),
  setTopic: vi.fn(),
  setSourceUrl: vi.fn(),
  setSourceText: vi.fn(),
  setSourceWasAutoSearched: vi.fn(),
  setConfidenceBefore: vi.fn(),
  setIsRecording: vi.fn(),
  setTranscript: vi.fn(),
  appendTranscript: vi.fn(),
  setRecordingDuration: vi.fn(),
  setAnalysis: vi.fn(),
  setRouting: vi.fn(),
  setQuestions: vi.fn(),
  setCurrentQuestionIndex: vi.fn(),
  addAnswer: vi.fn(),
  setLearningCard: vi.fn(),
  setIsLoading: vi.fn(),
  setError: vi.fn(),
  setSessions: vi.fn(),
  addSession: vi.fn(),
  resetSession: vi.fn(),
};

vi.mock('../store/sessionStore', () => ({
  default: (selector) => selector(mockStore),
}));

vi.mock('../api/claude', () => ({
  searchForSource: vi.fn(),
  analyzeExplanation: vi.fn(),
  generateSocraticQuestions: vi.fn(),
  evaluateAnswer: vi.fn(),
  generateLearningCard: vi.fn(),
}));

vi.mock('../api/tutorial', () => ({
  getOpeningResponse: vi.fn().mockResolvedValue({ response: 'test', internal_assessment: {} }),
  getFollowUpResponse: vi.fn().mockResolvedValue({ response: 'test', should_continue: true }),
  wrapUpTutorial: vi.fn().mockResolvedValue({ confidence_after: 5 }),
}));

vi.mock('../api/supabase', () => ({
  saveSession: vi.fn().mockResolvedValue({ id: 'test-id' }),
  loadSessions: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/speechService', () => ({
  isSupported: vi.fn().mockReturnValue(true),
  startListening: vi.fn().mockReturnValue(true),
  stopListening: vi.fn(),
  speak: vi.fn(),
  stopSpeaking: vi.fn(),
}));

vi.mock('../services/chunkedAnalysis', () => ({
  startChunkedAnalysis: vi.fn(),
  stopChunkedAnalysis: vi.fn(),
  finishAnalysis: vi.fn().mockResolvedValue({}),
  getCallCount: vi.fn().mockReturnValue(0),
}));

import Layout from '../components/Layout';
import SourceInput from '../components/SourceInput';
import ConfidenceSlider from '../components/ConfidenceSlider';
import VoiceRecorder from '../components/VoiceRecorder';
import SessionHistory from '../components/SessionHistory';

describe('Component Smoke Tests', () => {
  it('Layout renders header', () => {
    render(<Layout><div>child</div></Layout>);
    expect(screen.getByText('Viva')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('SourceInput renders topic field and modes', () => {
    render(<SourceInput />);
    expect(screen.getByText('What are you learning?')).toBeInTheDocument();
    expect(screen.getByText('Just a topic')).toBeInTheDocument();
    expect(screen.getByText('URL')).toBeInTheDocument();
    expect(screen.getByText('Paste text')).toBeInTheDocument();
  });

  it('ConfidenceSlider renders', () => {
    render(<ConfidenceSlider />);
    expect(screen.getByText('Before you explain...')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Explaining/ })).toBeInTheDocument();
  });

  it('VoiceRecorder renders mic and instructions', () => {
    render(<VoiceRecorder />);
    expect(screen.getByText(/Explain:/)).toBeInTheDocument();
    expect(screen.getByText(/under a minute/)).toBeInTheDocument();
    expect(screen.getByText(/mic issues/)).toBeInTheDocument();
  });

  it('SessionHistory renders empty state with demo sessions', () => {
    render(<SessionHistory onNewSession={vi.fn()} />);
    expect(screen.getByText('Your Tutorial Sessions')).toBeInTheDocument();
  });
});
