import { useState, useEffect } from 'react';
import { Mic, ArrowRight, Cpu, Zap, Brain, Activity } from 'lucide-react';

const ROTATING_TOPICS = [
  'backpropagation',
  'Nash equilibrium',
  'React useEffect',
  'the CAP theorem',
  'quantum entanglement',
  'constitutional law',
  'dopamine pathways',
  'the Krebs cycle',
];

export default function ColdOpenHero({ topicInput, setTopicInput, onStart }) {
  const [topicIndex, setTopicIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setTopicIndex((i) => (i + 1) % ROTATING_TOPICS.length);
        setIsTransitioning(false);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="cold-open">
      {/* ─── Background texture ─── */}
      <div className="cold-open-bg" />
      <div className="cold-open-grid" />

      {/* ─── Main content ─── */}
      <div className="cold-open-content">
        {/* Tagline */}
        <div className="cold-open-eyebrow">
          <span className="cold-open-eyebrow-dot" />
          VOICE-FIRST LEARNING WITH OPUS 4.6
        </div>

        {/* Headline */}
        <h1 className="cold-open-headline">
          <span className="cold-open-line1">Can you explain</span>
          <span className={`cold-open-topic ${isTransitioning ? 'cold-open-topic--exit' : 'cold-open-topic--enter'}`}>
            {ROTATING_TOPICS[topicIndex]}
          </span>
          <span className="cold-open-line3">under pressure?</span>
        </h1>

        {/* Sub */}
        <p className="cold-open-sub">
          Speak what you know. An AI supervisor finds the gaps.<br />
          Not a chatbot — a viva voce examination.
        </p>

        {/* Input + CTA */}
        <div className="cold-open-action">
          <div className="cold-open-input-wrap">
            <input
              className="cold-open-input"
              placeholder="Enter a topic — or just hit start"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onStart()}
            />
            <button onClick={onStart} className="cold-open-cta">
              <Mic className="w-5 h-5" />
              Start Viva
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Architecture badges */}
        <div className="cold-open-arch">
          <div className="cold-open-arch-badge">
            <Cpu className="w-3.5 h-3.5" />
            <span>Chunked pre-calling</span>
          </div>
          <div className="cold-open-arch-badge">
            <Activity className="w-3.5 h-3.5" />
            <span>4-mode adaptive routing</span>
          </div>
          <div className="cold-open-arch-badge">
            <Brain className="w-3.5 h-3.5" />
            <span>Meta-learning analysis</span>
          </div>
          <div className="cold-open-arch-badge">
            <Zap className="w-3.5 h-3.5" />
            <span>Background analysis while you speak</span>
          </div>
        </div>
      </div>
    </div>
  );
}
