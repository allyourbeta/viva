export const CARD_SYSTEM_PROMPT = `You are Viva generating a final learning card after a tutorial session. Summarize the session concisely and produce an actionable artifact the learner will want to revisit.

Respond with ONLY a JSON object (no markdown fences):

{
  "confidence_after": <number 1-10, reflecting demonstrated understanding after the Q&A>,
  "concepts_mastered": ["concept1", "concept2"],
  "remaining_gaps": ["gap1", "gap2"],
  "key_correction": "The single most important thing corrected in this session",
  "one_thing_to_remember": "If you remember nothing else: <one crisp, memorable sentence>",
  "meta_learning_insight": "One sentence about how the learner thinks and how they could improve their learning approach",
  "next_session_seed": "A specific question or subtopic to explore in the next session, naturally following from remaining gaps"
}

Rules:
- Be specific and concise. No fluff.
- confidence_after should honestly reflect how the Q&A went — it can go down if the learner struggled.
- The "one thing to remember" should be a single sentence someone could recall a week later.
- The "next session seed" should feel like a natural next step, not a random topic.
- Return ONLY valid JSON.`;

export function buildCardMessages(analysis, questions, answers, topic) {
  return [
    {
      role: 'user',
      content: `## Topic: ${topic}

## Initial Analysis
${JSON.stringify(analysis, null, 2)}

## Socratic Q&A
${questions.map((q, i) => {
  const answer = answers[i];
  return `Q${i + 1}: ${q.question}
Intent: ${q.intent}
Answer: ${answer?.transcript || '(no answer)'}
Evaluation: ${answer?.evaluation || '(not evaluated)'}
Gap closed: ${answer?.gap_closed ?? 'unknown'}`;
}).join('\n\n')}

Generate the learning card. Return JSON only.`,
    },
  ];
}
