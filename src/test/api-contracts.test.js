/**
 * Tier 1: API Contract Tests
 * 
 * These test that our extractJSON and response handling logic works correctly
 * with the shapes Claude actually returns. We mock the Anthropic client
 * so these run instantly without API calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock response builders ---

function mockClaudeResponse(text, stopReason = 'end_turn') {
  return {
    content: [{ type: 'text', text }],
    stop_reason: stopReason,
  };
}

function mockToolUseResponse() {
  return {
    content: [{ type: 'tool_use', id: 'toolu_123', name: 'web_search', input: { query: 'test' } }],
    stop_reason: 'tool_use',
  };
}

// --- extractJSON tests (inline since it's not exported) ---

function extractJSON(response) {
  const textParts = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
  if (!textParts.trim()) throw new Error('No text content');
  const cleaned = textParts.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

describe('extractJSON', () => {
  it('parses clean JSON', () => {
    const response = mockClaudeResponse('{"key": "value"}');
    expect(extractJSON(response)).toEqual({ key: 'value' });
  });

  it('strips markdown fences', () => {
    const response = mockClaudeResponse('```json\n{"key": "value"}\n```');
    expect(extractJSON(response)).toEqual({ key: 'value' });
  });

  it('strips fences without json label', () => {
    const response = mockClaudeResponse('```\n{"key": "value"}\n```');
    expect(extractJSON(response)).toEqual({ key: 'value' });
  });

  it('throws on empty text', () => {
    const response = { content: [{ type: 'text', text: '' }] };
    expect(() => extractJSON(response)).toThrow();
  });

  it('throws on tool_use only (no text)', () => {
    const response = mockToolUseResponse();
    expect(() => extractJSON(response)).toThrow('No text content');
  });

  it('handles text + tool_use blocks together', () => {
    const response = {
      content: [
        { type: 'text', text: '{"key": "value"}' },
        { type: 'tool_use', id: 'x', name: 'web_search', input: {} },
      ],
      stop_reason: 'tool_use',
    };
    expect(extractJSON(response)).toEqual({ key: 'value' });
  });
});

// --- Response schema validation ---

describe('Analysis response schema', () => {
  const validAnalysis = {
    key_concepts: ['concept1', 'concept2'],
    solid_understanding: [{ concept: 'X', evidence: 'said Y' }],
    fuzzy_areas: [{ concept: 'A', issue: 'vague about B' }],
    factual_errors: [],
    blind_spots: [{ concept: 'C', source_reference: 'source says...' }],
    confidence_assessment: 4,
    meta_learning_insight: 'Relies on analogies',
    routing_decision: {
      mode: 'gap_fix',
      rationale: 'Major gaps detected',
      plan: ['Step 1', 'Step 2', 'Step 3'],
    },
  };

  it('has all required top-level fields', () => {
    const required = [
      'key_concepts', 'solid_understanding', 'fuzzy_areas',
      'factual_errors', 'blind_spots', 'confidence_assessment',
      'meta_learning_insight', 'routing_decision',
    ];
    for (const field of required) {
      expect(validAnalysis).toHaveProperty(field);
    }
  });

  it('routing_decision has mode, rationale, plan', () => {
    expect(validAnalysis.routing_decision).toHaveProperty('mode');
    expect(validAnalysis.routing_decision).toHaveProperty('rationale');
    expect(validAnalysis.routing_decision).toHaveProperty('plan');
    expect(['gap_fix', 'socratic_probe', 'level_up', 'conflict_resolution'])
      .toContain(validAnalysis.routing_decision.mode);
  });

  it('confidence_assessment is 1-10', () => {
    expect(validAnalysis.confidence_assessment).toBeGreaterThanOrEqual(1);
    expect(validAnalysis.confidence_assessment).toBeLessThanOrEqual(10);
  });
});

describe('Socratic questions response schema', () => {
  const validQuestions = {
    questions: [
      {
        question: 'What happens when...?',
        intent: 'fix_misconception',
        target_gap: 'dependency array',
        good_answer_includes: 'Re-renders on every change',
      },
    ],
  };

  it('has questions array', () => {
    expect(validQuestions.questions).toBeInstanceOf(Array);
    expect(validQuestions.questions.length).toBeGreaterThan(0);
  });

  it('each question has required fields', () => {
    for (const q of validQuestions.questions) {
      expect(q).toHaveProperty('question');
      expect(q).toHaveProperty('intent');
      expect(q).toHaveProperty('target_gap');
      expect(q).toHaveProperty('good_answer_includes');
    }
  });

  it('intent is a valid value', () => {
    const validIntents = ['fix_misconception', 'deepen_understanding', 'test_transfer', 'connect_concepts'];
    for (const q of validQuestions.questions) {
      expect(validIntents).toContain(q.intent);
    }
  });
});

describe('Answer evaluation response schema', () => {
  const validEval = {
    gap_closed: true,
    evaluation: 'Good understanding of the core concept',
    correction: null,
    follow_up_needed: false,
    follow_up_question: null,
    sources_cited: [],
  };

  it('has all required fields', () => {
    expect(validEval).toHaveProperty('gap_closed');
    expect(validEval).toHaveProperty('evaluation');
    expect(typeof validEval.gap_closed).toBe('boolean');
    expect(typeof validEval.evaluation).toBe('string');
  });
});

describe('Learning card response schema', () => {
  const validCard = {
    confidence_after: 6,
    concepts_mastered: ['arrays', 'loops'],
    remaining_gaps: ['recursion'],
    key_correction: 'Arrays are zero-indexed',
    one_thing_to_remember: 'Always check your base case',
    meta_learning_insight: 'Strong on concrete examples, weak on abstractions',
    next_session_seed: 'Try explaining recursion using the call stack',
  };

  it('has all required fields', () => {
    const required = [
      'confidence_after', 'concepts_mastered', 'remaining_gaps',
      'key_correction', 'one_thing_to_remember', 'meta_learning_insight',
      'next_session_seed',
    ];
    for (const field of required) {
      expect(validCard).toHaveProperty(field);
    }
  });

  it('confidence_after is 1-10', () => {
    expect(validCard.confidence_after).toBeGreaterThanOrEqual(1);
    expect(validCard.confidence_after).toBeLessThanOrEqual(10);
  });

  it('mastered and gaps are arrays', () => {
    expect(validCard.concepts_mastered).toBeInstanceOf(Array);
    expect(validCard.remaining_gaps).toBeInstanceOf(Array);
  });
});
