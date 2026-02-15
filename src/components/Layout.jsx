import { GraduationCap } from 'lucide-react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-warm-50">
      <header className="border-b border-warm-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-serif text-warm-900 tracking-tight">
              Viva
            </h1>
            <p className="text-xs text-warm-500 -mt-0.5">Your AI Supervisor</p>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
