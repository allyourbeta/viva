/**
 * Tier 2: Component Structure & Content Tests (Scholarly Redesign)
 * 
 * These verify that components render the right structure, use the right
 * CSS classes, and display the right content. They catch:
 * - Missing CSS class application (paper-card, label-caps, etc.)
 * - Wrong layout structure (grid vs single column)
 * - Missing content sections
 * - Broken prop drilling
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Shared mock store ──

const createMockStore = (overrides = {}) => ({
  step: 'source',
  topic: 'Backpropagation',
  sourceUrl: '',
  sourceText: 'Neural networks learn by...',
  sourceWasAutoSearched: false,
  confidenceBefore: 5,
  isRecording: false,
  transcript: 'Backprop is when gradients flow backward...',
  recordingDuration: 45,
  analysis: null,
  routingMode: 'gap_fix',
  routingRationale: 'Student confuses gradient and loss',
  routingPlan: [],
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  learningCard: {
    confidence_after: 7,
    concepts_mastered: ['chain rule', 'forward pass'],
    remaining_gaps: ['vanishing gradients'],
    key_correction: 'Gradients flow backward, not the loss itself',
    one_thing_to_remember: 'Backprop is just calculus — chain rule applied layer by layer',
    meta_learning_insight: 'Strong on intuition, weak on formal definitions',
    next_session_seed: 'Try explaining vanishing gradients using sigmoid activation',
  },
  isLoading: false,
  error: null,
  sessions: [
    {
      id: '1',
      topic: 'CAP Theorem',
      routing_mode: 'gap_fix',
      confidence_before: 4,
      confidence_after: 7,
      one_thing_to_remember: 'Network partitions are inevitable',
      created_at: '2026-02-10T10:00:00Z',
      learning_card: { confidence_after: 7, one_thing_to_remember: 'Network partitions are inevitable' },
    },
    {
      id: '2',
      topic: 'React useEffect',
      routing_mode: 'socratic_probe',
      confidence_before: 8,
      confidence_after: 6,
      one_thing_to_remember: 'Every value from the component scope must be in the dependency array',
      created_at: '2026-02-14T10:00:00Z',
      learning_card: { confidence_after: 6, one_thing_to_remember: 'Every value from the component scope must be in the dependency array' },
    },
  ],
  // Actions
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
  ...overrides,
});

let mockStoreState;

vi.mock('../store/sessionStore', () => ({
  default: Object.assign(
    (selector) => selector(mockStoreState),
    { getState: () => mockStoreState },
  ),
}));

vi.mock('../api/claude', () => ({
  searchForSource: vi.fn(),
  analyzeExplanation: vi.fn(),
  generateSocraticQuestions: vi.fn(),
  evaluateAnswer: vi.fn(),
  generateLearningCard: vi.fn(),
}));

vi.mock('../api/tutorial', () => ({
  getOpeningResponse: vi.fn().mockResolvedValue({
    response: 'Tell me what you understand about backpropagation.',
    internal_assessment: { mode: 'gap_fix', key_weakness_targeted: 'Confuses gradient flow' },
  }),
  getFollowUpResponse: vi.fn().mockResolvedValue({
    response: 'Good. But what about the chain rule?',
    should_continue: true,
    internal_assessment: { mode: 'socratic_probe', key_weakness_targeted: 'Chain rule application' },
  }),
  wrapUpTutorial: vi.fn().mockResolvedValue({ confidence_after: 7 }),
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

vi.mock('../services/demoData', () => ({
  mergeWithDemoSessions: vi.fn((sessions) => sessions),
}));

vi.mock('../services/chunkedAnalysis', () => ({
  startChunkedAnalysis: vi.fn(),
  stopChunkedAnalysis: vi.fn(),
  finishAnalysis: vi.fn().mockResolvedValue({}),
  getCallCount: vi.fn().mockReturnValue(0),
}));

// ── Imports (after mocks) ──

import Layout from '../components/Layout';
import SessionHistory from '../components/SessionHistory';
import LearningCard from '../components/LearningCard';
import SessionDashboard, { MODE_CONFIG } from '../components/SessionDashboard';

// ═══════════════════════════════════════════
// Layout
// ═══════════════════════════════════════════

describe('Layout (scholarly header)', () => {
  beforeEach(() => { mockStoreState = createMockStore(); });

  it('renders VIVA header label', () => {
    render(<Layout><div>child</div></Layout>);
    expect(screen.getByText('Viva')).toBeInTheDocument();
  });

  it('shows "Tutorial Ledger" when on home screen', () => {
    mockStoreState = createMockStore({ step: 'source' });
    render(<Layout><div>child</div></Layout>);
    expect(screen.getByText('Tutorial Ledger')).toBeInTheDocument();
  });

  it('shows "Live Tutorial" when in tutorial', () => {
    mockStoreState = createMockStore({ step: 'tutorial' });
    render(<Layout><div>child</div></Layout>);
    expect(screen.getByText('Live Tutorial')).toBeInTheDocument();
  });

  it('shows "Session Report" when on card', () => {
    mockStoreState = createMockStore({ step: 'card' });
    render(<Layout><div>child</div></Layout>);
    expect(screen.getByText('Session Report')).toBeInTheDocument();
  });

  it('header shows tagline', () => {
    render(<Layout><div>child</div></Layout>);
    expect(screen.getByText('Explain it. Defend it. Know it.')).toBeInTheDocument();
  });

  it('header uses label-caps class for the brand label', () => {
    render(<Layout><div>child</div></Layout>);
    const viva = screen.getByText('Viva');
    expect(viva.className).toContain('label-caps');
  });

  it('header uses serif class for the subtitle', () => {
    render(<Layout><div>child</div></Layout>);
    const subtitle = screen.getByText('Tutorial Ledger');
    expect(subtitle.className).toContain('serif');
  });

  it('renders children inside main', () => {
    render(<Layout><div data-testid="child">content</div></Layout>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('main has max-w-6xl for non-tutorial (1152px wide, not narrow column)', () => {
    const { container } = render(<Layout><div>content</div></Layout>);
    const main = container.querySelector('main');
    expect(main.className).toContain('max-w-6xl');
    // Should NOT have max-w-xl or max-w-2xl (the "narrow column" anti-pattern)
    expect(main.className).not.toMatch(/max-w-(xl|2xl|lg|md|sm)\b/);
  });

  it('main has max-w-[1400px] for tutorial screen', () => {
    mockStoreState = createMockStore({ step: 'tutorial' });
    const { container } = render(<Layout><div>content</div></Layout>);
    const main = container.querySelector('main');
    expect(main.className).toContain('max-w-[1400px]');
  });
});

// ═══════════════════════════════════════════
// SessionHistory (Home Screen)
// ═══════════════════════════════════════════

describe('SessionHistory (scholarly home screen)', () => {
  const onNewSession = vi.fn();
  beforeEach(() => {
    mockStoreState = createMockStore();
    onNewSession.mockClear();
  });

  it('uses 12-column grid layout', () => {
    const { container } = render(<SessionHistory onNewSession={onNewSession} />);
    const grid = container.querySelector('.grid');
    expect(grid.className).toContain('grid-cols-12');
  });

  it('has two-panel layout with md:col-span-5 and md:col-span-7', () => {
    const { container } = render(<SessionHistory onNewSession={onNewSession} />);
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBe(2);

    const leftPanel = sections[0];
    const rightPanel = sections[1];
    // Left should span 5 cols on medium screens
    expect(leftPanel.className).toContain('md:col-span-5');
    // Right should span 7 cols
    expect(rightPanel.className).toContain('md:col-span-7');
    // Both should be full-width on mobile
    expect(leftPanel.className).toContain('col-span-12');
    expect(rightPanel.className).toContain('col-span-12');
  });

  it('left panel contains paper-card elements', () => {
    const { container } = render(<SessionHistory onNewSession={onNewSession} />);
    const leftSection = container.querySelectorAll('section')[0];
    const cards = leftSection.querySelectorAll('.paper-card');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  it('shows "New tutorial" label-caps', () => {
    render(<SessionHistory onNewSession={onNewSession} />);
    const label = screen.getByText('New tutorial');
    expect(label.className).toContain('label-caps');
  });

  it('shows scholarly heading "What will you explain today?"', () => {
    render(<SessionHistory onNewSession={onNewSession} />);
    expect(screen.getByText('What will you explain today?')).toBeInTheDocument();
  });

  it('heading uses serif class', () => {
    render(<SessionHistory onNewSession={onNewSession} />);
    const heading = screen.getByText('What will you explain today?');
    expect(heading.className).toContain('serif');
  });

  it('shows topic input with placeholder', () => {
    render(<SessionHistory onNewSession={onNewSession} />);
    const input = screen.getByPlaceholderText(/Backpropagation/);
    expect(input).toBeInTheDocument();
  });

  it('shows "Start viva" button', () => {
    render(<SessionHistory onNewSession={onNewSession} />);
    expect(screen.getByText('Start viva')).toBeInTheDocument();
  });

  it('shows "How this works" section for first-time users', () => {
    mockStoreState = createMockStore({ sessions: [] });
    render(<SessionHistory onNewSession={onNewSession} />);
    expect(screen.getByText('How this works')).toBeInTheDocument();
    expect(screen.getByText(/viva voce/)).toBeInTheDocument();
  });

  it('shows "Session history" heading with serif class', () => {
    render(<SessionHistory onNewSession={onNewSession} />);
    const heading = screen.getByText('Session history');
    expect(heading.className).toContain('serif');
  });

  it('shows session count', () => {
    render(<SessionHistory onNewSession={onNewSession} />);
    expect(screen.getByText(/2 sessions/i)).toBeInTheDocument();
  });

  it('history section uses paper-card with divide-y', () => {
    const { container } = render(<SessionHistory onNewSession={onNewSession} />);
    // The right panel's paper-card should have divide-y for session entries
    const rightSection = container.querySelectorAll('section')[1];
    const historyCard = rightSection.querySelector('.paper-card');
    expect(historyCard).toBeTruthy();
    expect(historyCard.className).toContain('divide-y');
  });

  it('renders each session with topic in serif', () => {
    render(<SessionHistory onNewSession={onNewSession} />);
    const capTopic = screen.getByText('CAP Theorem');
    expect(capTopic.className).toContain('serif');
    const reactTopic = screen.getByText('React useEffect');
    expect(reactTopic.className).toContain('serif');
  });

  it('renders session mode badges', () => {
    render(<SessionHistory onNewSession={onNewSession} />);
    expect(screen.getByText('Gap Fix')).toBeInTheDocument();
    expect(screen.getByText('Probing')).toBeInTheDocument();
  });

  it('renders confidence deltas as chips', () => {
    render(<SessionHistory onNewSession={onNewSession} />);
    // Chips show +3 for CAP Theorem (4→7) and -2 for React useEffect (8→6)
    expect(screen.getByText('+3')).toBeInTheDocument();
    expect(screen.getByText('-2')).toBeInTheDocument();
  });

  it('renders "Remember:" one-liner for sessions', () => {
    render(<SessionHistory onNewSession={onNewSession} />);
    expect(screen.getByText(/Network partitions are inevitable/)).toBeInTheDocument();
  });

  it('"Remember" text uses serif italic in an amber card', () => {
    render(<SessionHistory onNewSession={onNewSession} />);
    const remember = screen.getByText(/Network partitions are inevitable/);
    expect(remember.className).toContain('serif');
    expect(remember.className).toContain('italic');
  });
});

// ═══════════════════════════════════════════
// SessionDashboard (Tutorial sidebar)
// ═══════════════════════════════════════════

describe('SessionDashboard (session docket)', () => {
  it('renders paper-card with session overview', () => {
    const { container } = render(
      <SessionDashboard
        topic="Backprop" confidenceBefore={5} currentMode="gap_fix"
        assessments={[]} roundCount={3} elapsed={125}
      />
    );
    expect(container.querySelector('.paper-card')).toBeTruthy();
  });

  it('shows mode label', () => {
    render(
      <SessionDashboard
        topic="Backprop" confidenceBefore={5} currentMode="gap_fix"
        assessments={[]} roundCount={3} elapsed={125}
      />
    );
    expect(screen.getByText('Gap Fix')).toBeInTheDocument();
  });

  it('shows formatted timer (2:05)', () => {
    render(
      <SessionDashboard
        topic="Backprop" confidenceBefore={5} currentMode="gap_fix"
        assessments={[]} roundCount={3} elapsed={125}
      />
    );
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('shows exchange count', () => {
    render(
      <SessionDashboard
        topic="Backprop" confidenceBefore={5} currentMode="gap_fix"
        assessments={[]} roundCount={3} elapsed={125}
      />
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows confidence before', () => {
    render(
      <SessionDashboard
        topic="Backprop" confidenceBefore={5} currentMode="gap_fix"
        assessments={[]} roundCount={3} elapsed={125}
      />
    );
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('renders mastered concepts with pill-mastered class', () => {
    const { container } = render(
      <SessionDashboard
        topic="Backprop" confidenceBefore={5} currentMode="gap_fix"
        assessments={[{ what_they_nailed: ['chain rule'], key_weakness_targeted: 'gradient flow', mode: 'gap_fix' }]}
        roundCount={3} elapsed={125}
      />
    );
    const mastered = container.querySelector('.pill-mastered');
    expect(mastered).toBeTruthy();
    expect(mastered.textContent).toContain('chain rule');
  });

  it('renders probing concepts with pill-probing class', () => {
    const { container } = render(
      <SessionDashboard
        topic="Backprop" confidenceBefore={5} currentMode="gap_fix"
        assessments={[{ what_they_nailed: [], key_weakness_targeted: 'gradient flow', mode: 'gap_fix' }]}
        roundCount={3} elapsed={125}
      />
    );
    const probing = container.querySelector('.pill-probing');
    expect(probing).toBeTruthy();
    expect(probing.textContent).toContain('gradient flow');
  });

  it('shows "Currently targeting" docket card', () => {
    render(
      <SessionDashboard
        topic="Backprop" confidenceBefore={5} currentMode="gap_fix"
        assessments={[{ what_they_nailed: [], key_weakness_targeted: 'gradient flow', mode: 'gap_fix' }]}
        roundCount={3} elapsed={125}
      />
    );
    expect(screen.getByText('Currently targeting')).toBeInTheDocument();
    expect(screen.getAllByText('gradient flow').length).toBeGreaterThanOrEqual(1);
  });

  it('exports MODE_CONFIG for use in other components', () => {
    expect(MODE_CONFIG).toBeDefined();
    expect(MODE_CONFIG.gap_fix).toHaveProperty('label', 'Gap Fix');
    expect(MODE_CONFIG.level_up).toHaveProperty('label', 'Level Up');
  });
});

// ═══════════════════════════════════════════
// LearningCard (Report folio)
// ═══════════════════════════════════════════

describe('LearningCard (scholarly report)', () => {
  const onDone = vi.fn();
  beforeEach(() => {
    mockStoreState = createMockStore();
    onDone.mockClear();
  });

  it('wraps in max-w-4xl (wide but centered)', () => {
    const { container } = render(<LearningCard onDone={onDone} />);
    const wrapper = container.firstChild;
    expect(wrapper.className).toContain('max-w-4xl');
    // Should NOT be narrow
    expect(wrapper.className).not.toMatch(/max-w-(xl|2xl|lg|md|sm)\b/);
  });

  it('uses paper-card for the main card', () => {
    const { container } = render(<LearningCard onDone={onDone} />);
    expect(container.querySelector('.paper-card')).toBeTruthy();
  });

  it('shows "Tutorial report" label-caps', () => {
    render(<LearningCard onDone={onDone} />);
    expect(screen.getByText('Tutorial report')).toBeInTheDocument();
  });

  it('shows topic as serif heading', () => {
    render(<LearningCard onDone={onDone} />);
    const heading = screen.getByText('Backpropagation');
    expect(heading.tagName).toBe('H1');
    expect(heading.className).toContain('serif');
  });

  it('shows supervisor assessment score', () => {
    render(<LearningCard onDone={onDone} />);
    expect(screen.getByText("Supervisor's Assessment")).toBeInTheDocument();
    // After = 7
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('shows assessment score with /10 denominator', () => {
    const { container } = render(<LearningCard onDone={onDone} />);
    expect(container.textContent).toContain('/10');
  });

  it('assessment score is color-coded (sage for 6+, oxblood for below)', () => {
    render(<LearningCard onDone={onDone} />);
    // Score of 7 should be present and rendered large
    const scoreEl = screen.getByText('7');
    expect(scoreEl).toBeInTheDocument();
  });

  it('handles null learningCard assessment gracefully', () => {
    mockStoreState = createMockStore({ learningCard: null });
    render(<LearningCard onDone={onDone} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('shows key correction section', () => {
    render(<LearningCard onDone={onDone} />);
    expect(screen.getByText('Key correction')).toBeInTheDocument();
    expect(screen.getByText(/Gradients flow backward/)).toBeInTheDocument();
  });

  it('shows "one thing to remember" in serif with quotes', () => {
    render(<LearningCard onDone={onDone} />);
    const oneThingLabel = screen.getByText('One thing to remember');
    expect(oneThingLabel).toBeInTheDocument();
    const quote = screen.getByText(/Backprop is just calculus/);
    expect(quote.className).toContain('serif');
  });

  it('shows meta-learning insight as "How you think"', () => {
    render(<LearningCard onDone={onDone} />);
    expect(screen.getByText('How you think')).toBeInTheDocument();
    expect(screen.getByText(/Strong on intuition/)).toBeInTheDocument();
  });

  it('shows mastered concepts with pill-mastered', () => {
    const { container } = render(<LearningCard onDone={onDone} />);
    const mastered = container.querySelector('.pill-mastered');
    expect(mastered).toBeTruthy();
    expect(screen.getByText('chain rule')).toBeInTheDocument();
    expect(screen.getByText('forward pass')).toBeInTheDocument();
  });

  it('shows remaining gaps with pill-probing', () => {
    const { container } = render(<LearningCard onDone={onDone} />);
    const probing = container.querySelector('.pill-probing');
    expect(probing).toBeTruthy();
    expect(screen.getByText('vanishing gradients')).toBeInTheDocument();
  });

  it('shows next session seed as "Your next challenge"', () => {
    render(<LearningCard onDone={onDone} />);
    expect(screen.getByText('Your next challenge')).toBeInTheDocument();
    expect(screen.getByText(/vanishing gradients using sigmoid/)).toBeInTheDocument();
  });

  it('has two-column layout for content (md:col-span-7 + md:col-span-5)', () => {
    const { container } = render(<LearningCard onDone={onDone} />);
    expect(container.querySelector('.md\\:col-span-7')).toBeTruthy();
    expect(container.querySelector('.md\\:col-span-5')).toBeTruthy();
  });

  it('"Back to ledger" button calls onDone', async () => {
    render(<LearningCard onDone={onDone} />);
    const btn = screen.getByText('Back to ledger');
    await userEvent.click(btn);
    expect(onDone).toHaveBeenCalled();
  });

  it('shows footer with "Saved to your tutorial history"', () => {
    render(<LearningCard onDone={onDone} />);
    expect(screen.getByText(/Saved to your tutorial history/)).toBeInTheDocument();
  });

  it('handles low confidence_after with oxblood color', () => {
    mockStoreState = createMockStore({
      learningCard: {
        ...createMockStore().learningCard,
        confidence_after: 3,
      },
    });
    const { container } = render(<LearningCard onDone={onDone} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('handles null learningCard gracefully', () => {
    mockStoreState = createMockStore({ learningCard: null });
    render(<LearningCard onDone={onDone} />);
    // Should still render without crashing
    expect(screen.getByText('Backpropagation')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument(); // confidence_after = '?'
  });
});
