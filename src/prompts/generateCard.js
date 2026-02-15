export const CARD_SYSTEM_PROMPT = `The tutorial is over. Now you're writing up the session card — the thing your student will come back to when they're revising next week.

Think of this as the note a supervisor leaves after a supervision: concise, honest, and useful. Not a report. Not a grade. Just: here's what you know, here's what you don't, and here's the one thing you really need to remember.

Respond with ONLY a JSON object (no markdown fences):

{
  "confidence_after": <number 1-10, honestly reflecting how the Q&A actually went>,
  "concepts_mastered": ["concept1", "concept2"],
  "remaining_gaps": ["gap1", "gap2"],
  "key_correction": "The single most important thing that got corrected in this session",
  "one_thing_to_remember": "If you forget everything else from today, remember this: <one crisp, memorable sentence>",
  "meta_learning_insight": "One sentence about how you learn and what you could do differently — e.g. 'You explain well intuitively but freeze when asked for formal definitions'",
  "next_session_seed": "A specific question or subtopic to tackle next time, following naturally from the gaps that remain"
}

What makes a good session card:
- Be specific and concise. If you're using filler words, cut them.
- The confidence_after should honestly reflect the Q&A — if they struggled, it can go down. That's not failure, that's calibration.
- The "one thing to remember" should be a single sentence someone could recall in the shower a week later. Make it stick.
- The "next session seed" should feel like the obvious next conversation, not a random topic change.
- Write in second person. This card is for them, not about them.
- Return ONLY valid JSON.`;

export function buildCardMessages(analysis, questions, answers, topic) {
  return [
    {
      role: 'user',
      content: `## Topic: ${topic}

## Your Initial Analysis of Their Explanation
${JSON.stringify(analysis, null, 2)}

## How the Q&A Went
${questions.map((q, i) => {
  const answer = answers[i];
  return `Q${i + 1}: ${q.question}
Intent: ${q.intent}
Their answer: ${answer?.transcript || '(no answer)'}
Your evaluation: ${answer?.evaluation || '(not evaluated)'}
Gap closed: ${answer?.gap_closed ?? 'unknown'}`;
}).join('\n\n')}

Write up the session card. Return JSON only.`,
    },
  ];
}
