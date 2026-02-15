import { useState } from 'react';
import useSessionStore from './store/sessionStore';
import SessionHistory from './components/SessionHistory';
import SessionWizard from './components/SessionWizard';
import Layout from './components/Layout';

export default function App() {
  const [view, setView] = useState('history');
  const resetSession = useSessionStore((s) => s.resetSession);

  const startNewSession = () => {
    resetSession();
    setView('session');
  };

  const backToHistory = () => {
    setView('history');
  };

  return (
    <Layout>
      {view === 'history' ? (
        <SessionHistory onNewSession={startNewSession} />
      ) : (
        <SessionWizard onComplete={backToHistory} onBack={backToHistory} />
      )}
    </Layout>
  );
}
