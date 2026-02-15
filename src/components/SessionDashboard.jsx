import { Brain, BookOpen, Target, Clock } from 'lucide-react';

export const MODE_CONFIG = {
  gap_fix: { label: 'Gap Fix', color: 'bg-red-500', ring: 'ring-red-200', text: 'text-red-700', bg: 'bg-red-50', desc: 'Correcting a misunderstanding' },
  socratic_probe: { label: 'Probing', color: 'bg-amber-500', ring: 'ring-amber-200', text: 'text-amber-700', bg: 'bg-amber-50', desc: 'Testing understanding depth' },
  level_up: { label: 'Level Up', color: 'bg-emerald-500', ring: 'ring-emerald-200', text: 'text-emerald-700', bg: 'bg-emerald-50', desc: 'Pushing to harder territory' },
  conflict_resolution: { label: 'Conflict', color: 'bg-purple-500', ring: 'ring-purple-200', text: 'text-purple-700', bg: 'bg-purple-50', desc: 'Resolving a contradiction' },
};

export default function SessionDashboard({ topic, confidenceBefore, currentMode, assessments, roundCount, elapsed }) {
  const mode = MODE_CONFIG[currentMode] || MODE_CONFIG.socratic_probe;
  const concepts = [];
  assessments.forEach((a) => {
    (a.what_they_nailed || []).forEach((c) => {
      if (!concepts.find((x) => x.name === c)) concepts.push({ name: c, status: 'solid' });
    });
    if (a.key_weakness_targeted) {
      const name = a.key_weakness_targeted.slice(0, 40);
      if (!concepts.find((x) => x.name === name)) concepts.push({ name, status: 'probing' });
    }
  });

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-warm-200 p-5">
        <p className="text-[10px] uppercase tracking-widest text-warm-400 font-semibold mb-1">Topic</p>
        <h3 className="font-serif font-bold text-warm-900 text-lg leading-snug">{topic}</h3>
      </div>

      <div className={`rounded-2xl border p-4 ${mode.bg} border-warm-200`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${mode.color} ring-4 ${mode.ring} animate-pulse`} />
          <div>
            <p className={`text-sm font-bold ${mode.text}`}>{mode.label} Mode</p>
            <p className="text-xs text-warm-500">{mode.desc}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl border border-warm-200 p-3 text-center">
          <Target className="w-4 h-4 text-warm-400 mx-auto mb-1" />
          <p className="text-lg font-bold font-serif text-warm-900">{confidenceBefore}</p>
          <p className="text-[9px] text-warm-400 uppercase tracking-wide">Confidence</p>
        </div>
        <div className="bg-white rounded-xl border border-warm-200 p-3 text-center">
          <BookOpen className="w-4 h-4 text-warm-400 mx-auto mb-1" />
          <p className="text-lg font-bold font-serif text-warm-900">{roundCount}</p>
          <p className="text-[9px] text-warm-400 uppercase tracking-wide">Exchanges</p>
        </div>
        <div className="bg-white rounded-xl border border-warm-200 p-3 text-center">
          <Clock className="w-4 h-4 text-warm-400 mx-auto mb-1" />
          <p className="text-lg font-bold font-serif text-warm-900">{Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}</p>
          <p className="text-[9px] text-warm-400 uppercase tracking-wide">Duration</p>
        </div>
      </div>

      {concepts.length > 0 && (
        <div className="bg-white rounded-2xl border border-warm-200 p-4">
          <p className="text-[10px] uppercase tracking-widest text-warm-400 font-semibold mb-3">Concepts Detected</p>
          <div className="space-y-2">
            {concepts.map((c, i) => (
              <div key={i} className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  c.status === 'solid' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                }`} />
                <span className={`text-xs ${c.status === 'solid' ? 'text-warm-600' : 'text-amber-700 font-medium'}`}>
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-warm-50 rounded-2xl border border-dashed border-warm-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-warm-400" />
          <p className="text-[10px] uppercase tracking-widest text-warm-400 font-semibold">Supervisor's Strategy</p>
        </div>
        {assessments.length > 0 ? (
          <p className="text-xs text-warm-500 italic leading-relaxed">
            {assessments[assessments.length - 1].key_weakness_targeted}
          </p>
        ) : (
          <p className="text-xs text-warm-400 italic">Analyzing your explanation...</p>
        )}
      </div>
    </div>
  );
}
