import { Brain } from 'lucide-react';

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mb-6 animate-pulse">
        <Brain className="w-8 h-8 text-primary-600" />
      </div>
      <h2 className="text-lg font-serif font-bold text-warm-900 mb-2">
        Your supervisor is reviewing...
      </h2>
      <p className="text-sm text-warm-500 text-center max-w-xs">
        Comparing your explanation against the source material, identifying gaps, and planning your tutorial.
      </p>
    </div>
  );
}
