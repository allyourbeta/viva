import { useEffect, useState } from 'react';
import useSessionStore from '../store/sessionStore';
import { loadSessions } from '../api/supabase';
import { mergeWithDemoSessions } from '../services/demoData';
import ColdOpenHero from './ColdOpenHero';

export default function SessionHistory({ onNewSession }) {
  const setSessions = useSessionStore((s) => s.setSessions);
  const [topicInput, setTopicInput] = useState('');

  useEffect(() => {
    loadSessions().then((real) => {
      const merged = mergeWithDemoSessions(real);
      const seen = new Set();
      const unique = merged.filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
      setSessions(unique);
    });
  }, [setSessions]);

  const handleStart = () => {
    const topic = topicInput.trim();
    onNewSession();
    if (topic) {
      useSessionStore.getState().setTopic(topic);
      useSessionStore.getState().setStep('recording');
    }
  };

  return (
    <div className="animate-fade-in">
      <ColdOpenHero
        topicInput={topicInput}
        setTopicInput={setTopicInput}
        onStart={handleStart}
      />
    </div>
  );
}
