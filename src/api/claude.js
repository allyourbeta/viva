import Anthropic from '@anthropic-ai/sdk';
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisMessages } from '../prompts/analyzeExplanation.js';
import { buildSocraticSystemPrompt, buildSocraticMessages } from '../prompts/socraticQuestions.js';
import { EVALUATE_SYSTEM_PROMPT, buildEvaluateMessages } from '../prompts/evaluateAnswer.js';
import { CARD_SYSTEM_PROMPT, buildCardMessages } from '../prompts/generateCard.js';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

const MODEL = 'claude-opus-4-6';

/**
 * Parse JSON from Claude's text response, handling markdown fences.
 */
function extractJSON(response) {
  const textParts = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  if (!textParts.trim()) {
    console.error('[Viva API] No text in response. Full response:', JSON.stringify(response.content));
    throw new Error('No text content in Claude response (possibly stuck on tool_use)');
  }

  const cleaned = textParts
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  return JSON.parse(cleaned);
}

/**
 * Core call wrapper with logging and timeout.
 */
async function callClaude({ system, messages, maxTokens = 4096 }) {
  const params = {
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages,
  };

  console.log(`[Viva API] Calling Claude (${maxTokens} max tokens)...`);
  const startTime = Date.now();

  const response = await client.messages.create(params);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Viva API] Response in ${elapsed}s, stop_reason: ${response.stop_reason}`);

  return response;
}

/**
 * Step 0: Generate source material from Claude's knowledge.
 * No web_search tool — Claude uses its training knowledge directly.
 */
export async function searchForSource(topic) {
  console.log(`[Viva API] searchForSource: "${topic}"`);

  const response = await callClaude({
    system: `You are a research assistant helping prepare reference material for a learning evaluation. Generate a comprehensive, accurate summary of the given topic that covers all key concepts, definitions, important nuances, and common misconceptions. This will be used as ground truth to evaluate a learner's understanding.

Return ONLY a JSON object (no markdown fences, no preamble):
{
  "source_text": "A comprehensive summary (500-1000 words) covering key concepts, definitions, and important nuances",
  "source_urls": [],
  "source_title": "A descriptive title for this reference material"
}`,
    messages: [{ role: 'user', content: `Generate comprehensive reference material for: ${topic}` }],
    maxTokens: 2048,
  });

  const result = extractJSON(response);
  console.log(`[Viva API] searchForSource complete: "${result.source_title}"`);
  return result;
}

/**
 * Step 3: Analyze the learner's explanation against source material.
 */
export async function analyzeExplanation(sourceText, transcript, confidenceBefore) {
  console.log(`[Viva API] analyzeExplanation (confidence: ${confidenceBefore})`);

  const response = await callClaude({
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: buildAnalysisMessages(sourceText, transcript, confidenceBefore),
    maxTokens: 4096,
  });

  const result = extractJSON(response);
  console.log(`[Viva API] analyzeExplanation complete:`, {
    mode: result.routing_decision?.mode,
    confidence: result.confidence_assessment,
  });
  return result;
}

/**
 * Step 5: Generate Socratic questions based on the analysis.
 */
export async function generateSocraticQuestions(analysis, sourceText) {
  const { mode, rationale } = analysis.routing_decision;
  console.log(`[Viva API] generateSocraticQuestions (mode: ${mode})`);

  const response = await callClaude({
    system: buildSocraticSystemPrompt(mode, rationale),
    messages: buildSocraticMessages(analysis, sourceText),
    maxTokens: 2048,
  });

  const data = extractJSON(response);
  const questions = data.questions || [];
  console.log(`[Viva API] generateSocraticQuestions: ${questions.length} questions`);
  return questions;
}

/**
 * Step 5 (per question): Evaluate the learner's spoken answer.
 */
export async function evaluateAnswer(question, userAnswer, sourceText) {
  console.log(`[Viva API] evaluateAnswer: "${question.question.slice(0, 50)}..."`);

  const response = await callClaude({
    system: EVALUATE_SYSTEM_PROMPT,
    messages: buildEvaluateMessages(question, userAnswer, sourceText),
    maxTokens: 1024,
  });

  const result = extractJSON(response);
  console.log(`[Viva API] evaluateAnswer: gap_closed=${result.gap_closed}`);
  return result;
}

/**
 * Step 6: Generate the learning card from the full session.
 */
export async function generateLearningCard(analysis, questions, answers, topic) {
  console.log(`[Viva API] generateLearningCard: "${topic}"`);

  const response = await callClaude({
    system: CARD_SYSTEM_PROMPT,
    messages: buildCardMessages(analysis, questions, answers, topic),
    maxTokens: 1024,
  });

  const result = extractJSON(response);
  console.log(`[Viva API] generateLearningCard complete:`, {
    confidence_after: result.confidence_after,
  });
  return result;
}
