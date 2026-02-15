/**
 * Tier 1b: Live API Integration Test
 * 
 * Actually calls Claude Opus 4.6 to verify:
 * - Responses are valid JSON
 * - Response shapes match our schemas
 * - The full analysis → questions → evaluation → card pipeline works
 * 
 * Run manually: npx vitest run src/test/api-live.test.js
 * Requires VITE_ANTHROPIC_API_KEY in .env
 * 
 * WARNING: This costs API credits! Only run when debugging API issues.
 */
import { describe, it, expect } from 'vitest';

// Skip if no API key
const API_KEY = process.env.VITE_ANTHROPIC_API_KEY;
const describeIf = API_KEY ? describe : describe.skip;

describeIf('Live API Integration', () => {
  // Increase timeout — Opus can be slow
  const TIMEOUT = 120_000; // 2 minutes

  let analysis;

  it('analyzeExplanation returns valid schema', async () => {
    const { analyzeExplanation } = await import('../api/claude.js');

    const sourceText = 'A binary search tree (BST) is a data structure where each node has at most two children. The left child contains values less than the parent, and the right child contains values greater. This property enables O(log n) search, insertion, and deletion in balanced trees.';
    const transcript = 'So a binary search tree is like a tree where you put smaller things on the left and bigger things on the right. You can search really fast because you just go left or right at each step. I think its O of log n.';
    const confidenceBefore = 6;

    analysis = await analyzeExplanation(sourceText, transcript, confidenceBefore);

    // Validate shape
    expect(analysis).toHaveProperty('key_concepts');
    expect(analysis).toHaveProperty('solid_understanding');
    expect(analysis).toHaveProperty('fuzzy_areas');
    expect(analysis).toHaveProperty('factual_errors');
    expect(analysis).toHaveProperty('blind_spots');
    expect(analysis).toHaveProperty('confidence_assessment');
    expect(analysis).toHaveProperty('meta_learning_insight');
    expect(analysis).toHaveProperty('routing_decision');
    expect(analysis.routing_decision).toHaveProperty('mode');
    expect(analysis.routing_decision).toHaveProperty('rationale');

    console.log('[LIVE TEST] Analysis routing:', analysis.routing_decision.mode);
  }, TIMEOUT);

  it('generateSocraticQuestions returns questions array', async () => {
    if (!analysis) throw new Error('Analysis test must pass first');

    const { generateSocraticQuestions } = await import('../api/claude.js');
    const sourceText = 'BST source material...';

    const questions = await generateSocraticQuestions(analysis, sourceText);

    expect(questions).toBeInstanceOf(Array);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0]).toHaveProperty('question');
    expect(questions[0]).toHaveProperty('intent');

    console.log(`[LIVE TEST] Got ${questions.length} questions`);
  }, TIMEOUT);

  it('evaluateAnswer returns evaluation', async () => {
    const { evaluateAnswer } = await import('../api/claude.js');

    const question = {
      question: 'What happens to search performance when a BST becomes unbalanced?',
      intent: 'deepen_understanding',
      target_gap: 'balanced vs unbalanced trees',
      good_answer_includes: 'degrades to O(n) like a linked list',
    };
    const userAnswer = 'I think it gets slower but I am not sure how much slower exactly.';
    const sourceText = 'BST source...';

    const evaluation = await evaluateAnswer(question, userAnswer, sourceText);

    expect(evaluation).toHaveProperty('gap_closed');
    expect(evaluation).toHaveProperty('evaluation');
    expect(typeof evaluation.gap_closed).toBe('boolean');

    console.log('[LIVE TEST] Gap closed:', evaluation.gap_closed);
  }, TIMEOUT);

  it('generateLearningCard returns card', async () => {
    if (!analysis) throw new Error('Analysis test must pass first');

    const { generateLearningCard } = await import('../api/claude.js');

    const questions = [{ question: 'Test Q', intent: 'test', target_gap: 'test', good_answer_includes: 'test' }];
    const answers = [{ transcript: 'Test answer', gap_closed: true, evaluation: 'Good' }];

    const card = await generateLearningCard(analysis, questions, answers, 'Binary Search Trees');

    expect(card).toHaveProperty('confidence_after');
    expect(card).toHaveProperty('concepts_mastered');
    expect(card).toHaveProperty('remaining_gaps');
    expect(card).toHaveProperty('one_thing_to_remember');
    expect(card).toHaveProperty('next_session_seed');

    console.log('[LIVE TEST] Card:', card.one_thing_to_remember);
  }, TIMEOUT);
});
