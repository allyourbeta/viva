import { GraduationCap } from 'lucide-react';
import useSessionStore from '../store/sessionStore';

export default function Layout({ children }) {
  const step = useSessionStore((s) => s.step);
  const isTutorial = step === 'tutorial';

  return (
    <div className="min-h-screen">
      <header className="border-b border-warm-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className={`mx-auto px-6 py-3 flex items-center gap-3 ${isTutorial ? 'max-w-5xl' : 'max-w-xl'}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-sm shadow-primary-600/20">
            <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-lg font-bold font-serif text-warm-900 tracking-tight leading-none">
              Viva
            </h1>
            <p className="text-[11px] text-warm-500 tracking-wide">Your AI Supervisor</p>
          </div>
        </div>
      </header>
      <main className={`mx-auto px-6 py-6 ${isTutorial ? 'max-w-5xl' : 'max-w-xl'}`}>
        {children}
      </main>
    </div>
  );
}
