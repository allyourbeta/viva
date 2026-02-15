import { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';

const MESSAGES = [
  'Reading your explanation carefully...',
  'Comparing against source material...',
  'Identifying what you got right...',
  'Finding the gaps in your understanding...',
  'Deciding how to challenge you next...',
  'Preparing your tutorial plan...',
];

export default function LoadingState() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 4000);
    const clockTimer = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      clearInterval(msgTimer);
      clearInterval(clockTimer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mb-6 animate-pulse">
        <Brain className="w-8 h-8 text-primary-600" />
      </div>
      <h2 className="text-lg font-serif font-bold text-warm-900 mb-2">
        Your supervisor is reviewing...
      </h2>
      <p className="text-sm text-warm-500 text-center max-w-xs transition-opacity duration-500">
        {MESSAGES[msgIndex]}
      </p>
      <p className="text-xs text-warm-300 mt-4 font-mono">{elapsed}s</p>
    </div>
  );
}
