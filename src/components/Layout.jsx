import useSessionStore from '../store/sessionStore';

export default function Layout({ children }) {
  const step = useSessionStore((s) => s.step);
  const isTutorial = step === 'tutorial';

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: 'var(--rule)' }}>
        <div>
          <div className="label-caps">Viva</div>
          <span className="serif text-lg font-semibold tracking-tight">
            {isTutorial ? 'Live Tutorial' : 'Tutorial Ledger'}
          </span>
        </div>
      </header>
      <main className={`mx-auto px-8 py-6 ${isTutorial ? 'max-w-[1400px]' : 'max-w-6xl'}`}>
        {children}
      </main>
    </div>
  );
}
