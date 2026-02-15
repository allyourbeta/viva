/**
 * Pre-seeded demo sessions for the hackathon screencast.
 * These appear in session history immediately, no API calls needed.
 * Shows judges that the product creates persistent, accumulating value.
 */

export const DEMO_SESSIONS = [
  {
    id: 'demo-001',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    topic: 'How Neural Networks Learn (Backpropagation)',
    confidence_before: 7,
    confidence_after: 5,
    routing_mode: 'gap_fix',
    concepts_mastered: ['Forward pass', 'Activation functions', 'Loss calculation'],
    remaining_gaps: ['Chain rule in backprop', 'Vanishing gradients', 'Weight initialization'],
    key_correction: 'Backpropagation doesn\'t "send errors backward" — it computes gradients of the loss with respect to each weight using the chain rule, then updates weights in the direction that reduces loss.',
    one_thing_to_remember: 'Backprop is just calculus — the chain rule applied layer by layer from output to input.',
    meta_learning_insight: 'You explain well with analogies but skip the math. The math IS the concept here — try explaining the chain rule step without metaphors.',
    next_session_seed: 'Explain vanishing gradients: why do deep networks struggle to train, and what do ReLU and residual connections do about it?',
  },
  {
    id: 'demo-002',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // yesterday
    topic: 'React useEffect Hook',
    confidence_before: 8,
    confidence_after: 6,
    routing_mode: 'socratic_probe',
    concepts_mastered: ['Basic syntax', 'Dependency array', 'Cleanup functions'],
    remaining_gaps: ['Stale closures', 'useEffect vs useLayoutEffect', 'Race conditions in async effects'],
    key_correction: 'An empty dependency array doesn\'t mean "run once" — it means "run when none of these dependencies change," which happens to be once. The mental model matters when debugging.',
    one_thing_to_remember: 'Every value from the component scope that changes over time and is used by the effect must be in the dependency array — or you get stale closures.',
    meta_learning_insight: 'You know the API surface well but haven\'t internalized WHY the rules exist. Try explaining dependency arrays by tracing what happens to closures across re-renders.',
    next_session_seed: 'Explain what happens step-by-step when you forget to include a state variable in useEffect\'s dependency array. Trace the closure.',
  },
  {
    id: 'demo-003',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    topic: 'The CAP Theorem',
    confidence_before: 4,
    confidence_after: 7,
    routing_mode: 'gap_fix',
    concepts_mastered: ['Three properties defined', 'Partition tolerance is non-negotiable', 'CP vs AP tradeoff'],
    remaining_gaps: ['PACELC extension'],
    key_correction: 'CAP doesn\'t say "pick 2 of 3" — it says when a network partition occurs (which is inevitable), you must choose between consistency and availability. Without partitions, you can have both.',
    one_thing_to_remember: 'Network partitions are inevitable in distributed systems — the real question is: when one happens, do you serve stale data (AP) or refuse to serve (CP)?',
    meta_learning_insight: 'You initially memorized the "pick 2" simplification without understanding why. Once pushed to explain partition tolerance, the real tradeoff clicked. Question your mnemonics.',
    next_session_seed: 'Explain PACELC: what tradeoff do distributed systems face even when there is NO partition?',
  },
];

/**
 * Merge demo sessions with real sessions from Supabase.
 * Demo sessions appear if no real sessions exist yet.
 */
export function mergeWithDemoSessions(realSessions) {
  if (realSessions.length >= 3) {
    return realSessions; // Enough real data, skip demos
  }
  // Show demos that aren't "replaced" by real sessions on same topic
  const realTopics = new Set(realSessions.map((s) => s.topic.toLowerCase()));
  const uniqueDemos = DEMO_SESSIONS.filter(
    (d) => !realTopics.has(d.topic.toLowerCase())
  );
  return [...realSessions, ...uniqueDemos].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}
