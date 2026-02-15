import Anthropic from '@anthropic-ai/sdk';
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisMessages, TOOLS } from '../prompts/analyzeExplanation.js';
import { buildSocraticSystemPrompt, buildSocraticMessages } from '../prompts/socraticQuestions.js';
import { EVALUATE_SYSTEM_PROMPT, buildEvaluateMessages } from '../prompts/evaluateAnswer.js';
import { CARD_SYSTEM_PROMPT, buildCardMessages } from '../prompts/generateCard.js';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

const MODEL = 'claude-opus-4-0-20250514';

/**
 * Parse JSON from Claude's response, handling markdown fences and tool use.
 */
function extractJSON(response) {
  // Collect all text blocks
  const textParts = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  // Strip markdown fences if present
  const cleaned = textParts
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  return JSON.parse(cleaned);
}

/**
 * Step 3: Analyze the learner's explanation against source material.
 */
export async function analyzeExplanation(sourceText, transcript, confidenceBefore) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: buildAnalysisMessages(sourceText, transcript, confidenceBefore),
    tools: TOOLS,
  });

  return extractJSON(response);
}

/**
 * Step 5: Generate Socratic questions based on the analysis.
 */
export async function generateSocraticQuestions(analysis, sourceText) {
  const { mode, rationale } = analysis.routing_decision;
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: buildSocraticSystemPrompt(mode, rationale),
    messages: buildSocraticMessages(analysis, sourceText),
    tools: TOOLS,
  });

  const data = extractJSON(response);
  return data.questions || [];
}

/**
 * Step 5 (per question): Evaluate the learner's spoken answer.
 */
export async function evaluateAnswer(question, userAnswer, sourceText) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: EVALUATE_SYSTEM_PROMPT,
    messages: buildEvaluateMessages(question, userAnswer, sourceText),
    tools: TOOLS,
  });

  return extractJSON(response);
}

/**
 * Step 6: Generate the learning card from the full session.
 */
export async function generateLearningCard(analysis, questions, answers, topic) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: CARD_SYSTEM_PROMPT,
    messages: buildCardMessages(analysis, questions, answers, topic),
  });

  return extractJSON(response);
}

/**
 * Step 0 (topic-only): Search for source material on a topic.
 */
export async function searchForSource(topic) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: `You are a research assistant. The user wants to learn about a topic but hasn't provided source material. Search the web for a good, authoritative explanation of this topic, then return a structured summary that can be used as reference material for evaluating the learner's understanding.

Return ONLY a JSON object:
{
  "source_text": "A comprehensive summary of the topic (500-1000 words) covering key concepts, definitions, and important nuances",
  "source_urls": ["url1", "url2"],
  "source_title": "A descriptive title for this reference material"
}`,
    messages: [{ role: 'user', content: `Find authoritative reference material for: ${topic}` }],
    tools: TOOLS,
  });

  return extractJSON(response);
}
