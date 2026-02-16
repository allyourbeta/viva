/**
 * Mock data for Storybook stories.
 * Mirrors the Zustand sessionStore shape so stories can call
 * useSessionStore.setState(mockState) in decorators.
 */

export const mockAnalysis = {
  confidence_assessment: 4,
  solid_understanding: [
    { concept: 'Basic BST structure', evidence: 'Correctly described node layout with left < root < right' },
    { concept: 'Search operation', evidence: 'Explained binary search analogy accurately' },
  ],
  fuzzy_areas: [
    { concept: 'Balancing', issue: 'Mentioned "self-balancing" but confused AVL rotations with red-black tree rules' },
  ],
  factual_errors: [
    {
      learner_said: 'BSTs always have O(log n) search',
      source_says: 'Only balanced BSTs guarantee O(log n); degenerate BSTs degrade to O(n)',
      why_it_matters: 'This is the most common misconception and the core reason balanced variants exist',
    },
  ],
  blind_spots: [
    { concept: 'Deletion cases', source_reference: 'Three cases: leaf, one child, two children (in-order successor)' },
  ],
  meta_learning_insight: 'You learn structures well but skip edge-case analysis — try breaking your own assumptions.',
};

export const mockLearningCard = {
  confidence_after: 7,
  key_correction: 'A BST is only O(log n) when balanced. Sorted inserts degrade it to a linked list with O(n) operations.',
  one_thing_to_remember: 'Balance is not a feature — it is the whole point.',
  meta_learning_insight: 'You tend to state best-case as if it were the general case. Always ask: when does this break?',
  concepts_mastered: ['Node structure', 'In-order traversal', 'Search operation'],
  remaining_gaps: ['Deletion algorithm', 'AVL rotation mechanics', 'Red-black tree invariants'],
  next_session_seed: 'Explain the three cases of BST deletion and why in-order successor is used.',
  tutorial_mode: 'gap_fix',
};

export const mockQuestions = [
  {
    question: 'What happens to search performance when a BST becomes completely unbalanced?',
    intent: 'fix_misconception',
    target_gap: 'BST worst-case complexity',
  },
  {
    question: 'Can you describe what an AVL rotation actually does to the tree structure?',
    intent: 'deepen_understanding',
    target_gap: 'Balancing mechanics',
  },
  {
    question: 'How would you delete a node that has two children from a BST?',
    intent: 'test_transfer',
    target_gap: 'Deletion algorithm',
  },
];

export const mockSessions = [
  {
    id: 'demo-1',
    topic: 'Binary Search Trees',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    confidence_before: 6,
    confidence_after: 7,
    routing_mode: 'gap_fix',
    one_thing_to_remember: 'Balance is not a feature — it is the whole point.',
  },
  {
    id: 'demo-2',
    topic: 'React useEffect Hook',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    confidence_before: 7,
    confidence_after: 8,
    routing_mode: 'socratic_probe',
    one_thing_to_remember: 'Effects are for synchronization, not for reacting to events.',
  },
  {
    id: 'demo-3',
    topic: 'Nash Equilibrium',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    confidence_before: 4,
    confidence_after: 3,
    routing_mode: 'conflict_resolution',
    one_thing_to_remember: null,
  },
];

export const mockAssessments = [
  {
    what_they_nailed: ['Basic BST structure'],
    key_weakness_targeted: 'Worst-case complexity when tree is unbalanced',
    mode: 'gap_fix',
  },
  {
    what_they_nailed: ['Basic BST structure', 'Search operation'],
    key_weakness_targeted: 'AVL rotation mechanics',
    mode: 'gap_fix',
  },
];

export const mockDisplayItems = [
  {
    type: 'message',
    role: 'supervisor',
    text: "You've described the basic structure well, but you made a critical claim that BSTs always have O(log n) search. Let's examine that. What happens if you insert the numbers 1, 2, 3, 4, 5 in order into an empty BST?",
    thinking: {
      mode: 'gap_fix',
      key_weakness_targeted: 'Worst-case complexity when tree is unbalanced',
    },
  },
  {
    type: 'message',
    role: 'student',
    text: "Oh right, if you insert sorted data it would just make a chain going to the right. So it would be like a linked list. The search would be O(n) because you'd have to go through every node.",
  },
  {
    type: 'message',
    role: 'supervisor',
    text: "Exactly. Now, what mechanism do balanced BST variants like AVL trees use to prevent this degeneracy?",
    thinking: {
      mode: 'gap_fix',
      key_weakness_targeted: 'AVL rotation mechanics',
    },
  },
];

/** Full store state for a session at the "card" step */
export const mockCardState = {
  step: 'card',
  topic: 'Binary Search Trees',
  sourceUrl: '',
  sourceText: 'A binary search tree is a rooted binary tree where each node stores a key...',
  sourceWasAutoSearched: true,
  confidenceBefore: 5,
  isRecording: false,
  transcript: 'A binary search tree has nodes where left is smaller and right is larger. You can search in O(log n) time...',
  recordingDuration: 45,
  analysis: mockAnalysis,
  routingMode: 'gap_fix',
  routingRationale: 'Student has a critical misconception about worst-case complexity.',
  routingPlan: ['Address O(log n) misconception', 'Probe balancing knowledge', 'Test deletion understanding'],
  questions: mockQuestions,
  currentQuestionIndex: 0,
  answers: [],
  learningCard: mockLearningCard,
  isLoading: false,
  error: null,
  sessions: mockSessions,
};

/** State for source input step */
export const mockSourceState = {
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
  sessions: [],
};

/** State for confidence step */
export const mockConfidenceState = {
  ...mockSourceState,
  step: 'confidence',
  topic: 'Binary Search Trees',
};

/** State for recording step */
export const mockRecordingState = {
  ...mockConfidenceState,
  step: 'recording',
  confidenceBefore: 6,
};

/** State for analysis view */
export const mockAnalysisState = {
  ...mockRecordingState,
  step: 'analysis',
  transcript: 'A binary search tree has nodes where left is smaller and right is larger...',
  recordingDuration: 42,
  analysis: mockAnalysis,
  routingMode: 'gap_fix',
  routingRationale: 'Student has a critical misconception about worst-case complexity.',
  routingPlan: ['Address O(log n) misconception', 'Probe balancing knowledge'],
};

/** State for tutorial step */
export const mockTutorialState = {
  ...mockAnalysisState,
  step: 'tutorial',
  confidenceBefore: 6,
};

/** State for the history/home view */
export const mockHistoryState = {
  ...mockSourceState,
  sessions: mockSessions,
};
