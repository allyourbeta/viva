import Anthropic from '@anthropic-ai/sdk';
import { emit } from '../services/telemetry';
import {
  TUTORIAL_SYSTEM_PROMPT,
  buildOpeningMessages,
  FOLLOWUP_SYSTEM_PROMPT,
  CLOSING_SYSTEM_PROMPT,
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
  emit('api_call', { endpoint: 'opening', model: MODEL });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: TUTORIAL_SYSTEM_PROMPT,
    messages: buildOpeningMessages(sourceText, transcript, confidenceBefore),
  });

  const ms = Date.now() - start;
  console.log(`[Viva Tutorial] Opening in ${(ms / 1000).toFixed(1)}s`);
  const result = extractJSON(response);
  emit('api_complete', { endpoint: 'opening', ms, model: MODEL });
  if (result.internal_assessment) {
    emit('assessment', { assessment: result.internal_assessment, endpoint: 'opening' });
  }
  return result;
}

/**
 * Follow-up — supervisor responds to the student's answer.
 * Sends full conversation history for context continuity.
 */
export async function getFollowUpResponse(conversationHistory, sourceText) {
  console.log(`[Viva Tutorial] Follow-up (${conversationHistory.length} messages)...`);
  const start = Date.now();
  emit('api_call', { endpoint: 'followup', model: MODEL, messageCount: conversationHistory.length });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: FOLLOWUP_SYSTEM_PROMPT + `\n\n## Source Material\n${sourceText || '(Use your own knowledge.)'}`,
    messages: conversationHistory,
  });

  const ms = Date.now() - start;
  console.log(`[Viva Tutorial] Follow-up in ${(ms / 1000).toFixed(1)}s`);
  const result = extractJSON(response);
  emit('api_complete', { endpoint: 'followup', ms, model: MODEL });
  if (result.internal_assessment) {
    emit('assessment', { assessment: result.internal_assessment, endpoint: 'followup' });
  }
  return result;
}

/**
 * Closing move — supervisor's final remark before the session ends.
 * No question asked — just a brief observation and encouragement.
 */
export async function getClosingResponse(conversationHistory, sourceText) {
  console.log('[Viva Tutorial] Closing move...');
  const start = Date.now();
  emit('api_call', { endpoint: 'closing', model: MODEL });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: CLOSING_SYSTEM_PROMPT + `\n\n## Source Material\n${sourceText || '(Use your own knowledge.)'}`,
    messages: conversationHistory,
  });

  const ms = Date.now() - start;
  console.log(`[Viva Tutorial] Closing in ${(ms / 1000).toFixed(1)}s`);
  const result = extractJSON(response);
  emit('api_complete', { endpoint: 'closing', ms, model: MODEL });
  if (result.internal_assessment) {
    emit('assessment', { assessment: result.internal_assessment, endpoint: 'closing' });
  }
  return result;
}

/**
 * Wrap up — generate the learning card from the full session.
 */
export async function wrapUpTutorial(conversationHistory, topic, confidenceBefore) {
  console.log('[Viva Tutorial] Generating learning card...');
  const start = Date.now();
  emit('api_call', { endpoint: 'wrapup', model: MODEL });

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

  const ms = Date.now() - start;
  console.log(`[Viva Tutorial] Card in ${(ms / 1000).toFixed(1)}s`);
  const result = extractJSON(response);
  emit('api_complete', { endpoint: 'wrapup', ms, model: MODEL });
  return result;
}
