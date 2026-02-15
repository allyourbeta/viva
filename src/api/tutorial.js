import Anthropic from '@anthropic-ai/sdk';
import {
  TUTORIAL_SYSTEM_PROMPT,
  buildOpeningMessages,
  FOLLOWUP_SYSTEM_PROMPT,
  WRAP_UP_PROMPT,
} from '../prompts/tutorial.js';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

const MODEL = 'claude-opus-4-6';

function extractJSON(response) {
  const textParts = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
  if (!textParts.trim()) throw new Error('No text content in response');
  const cleaned = textParts.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Opening move — supervisor's first response after hearing the explanation.
 */
export async function getOpeningResponse(sourceText, transcript, confidenceBefore) {
  console.log('[Viva Tutorial] Opening move...');
  const start = Date.now();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: TUTORIAL_SYSTEM_PROMPT,
    messages: buildOpeningMessages(sourceText, transcript, confidenceBefore),
  });

  console.log(`[Viva Tutorial] Opening in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  return extractJSON(response);
}

/**
 * Follow-up — supervisor responds to the student's answer.
 * Sends full conversation history for context continuity.
 */
export async function getFollowUpResponse(conversationHistory, sourceText) {
  console.log(`[Viva Tutorial] Follow-up (${conversationHistory.length} messages)...`);
  const start = Date.now();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: FOLLOWUP_SYSTEM_PROMPT + `\n\n## Source Material\n${sourceText || '(Use your own knowledge.)'}`,
    messages: conversationHistory,
  });

  console.log(`[Viva Tutorial] Follow-up in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  return extractJSON(response);
}

/**
 * Wrap up — generate the learning card from the full session.
 */
export async function wrapUpTutorial(conversationHistory, topic, confidenceBefore) {
  console.log('[Viva Tutorial] Generating learning card...');
  const start = Date.now();

  const fullContext = conversationHistory.map((m) =>
    `${m.role === 'user' ? 'Student' : 'Supervisor'}: ${m.content}`
  ).join('\n\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: WRAP_UP_PROMPT,
    messages: [{
      role: 'user',
      content: `## Topic: ${topic}\n## Student's initial confidence: ${confidenceBefore}/10\n\n## Full Tutorial Transcript\n${fullContext}\n\nGenerate the learning card.`,
    }],
  });

  console.log(`[Viva Tutorial] Card in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  return extractJSON(response);
}
