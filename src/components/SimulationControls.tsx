import type { SimulationStatus, SimMode, RunCount } from '../types';

interface Props {
  simStatus: SimulationStatus;
  onSimulate: (mode: SimMode, nRuns: RunCount) => void;
  onStop: () => void;
  onReset: () => void;
  disabled: boolean;
}

const RUN_COUNTS: RunCount[] = [100, 500, 1000];

const MODE_CONFIG: { mode: SimMode; label: string; icon: string; desc: string }[] = [
  { mode: 'next_player', label: 'Next Player', icon: '🎯', desc: 'Simulate current player only' },
  { mode: 'set', label: 'Current Set', icon: '📦', desc: 'Simulate entire current set' },
  { mode: 'full_auction', label: 'Full Auction', icon: '🏆', desc: 'Simulate complete auction' },
];

export default function SimulationControls({ simStatus, onSimulate, onStop, onReset, disabled }: Props) {
  const isRunning = simStatus.running;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Simulation Controls
        </span>
        {isRunning && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">Running…</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="rounded-lg bg-slate-800 border border-slate-700 p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>{simStatus.mode.replace('_', ' ')} simulation</span>
            <span>{simStatus.progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${simStatus.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Mode buttons grid */}
      <div className="grid gap-3">
        {MODE_CONFIG.map(({ mode, label, icon, desc }) => (
          <div key={mode} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span>{icon}</span>
              <span className="text-sm font-semibold text-white">{label}</span>
              <span className="text-xs text-slate-500">— {desc}</span>
            </div>
            <div className="flex gap-1.5">
              {RUN_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => onSimulate(mode, n)}
                  disabled={disabled || isRunning}
                  className="flex-1 py-1.5 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 transition-all active:scale-95"
                >
                  {n}×
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stop / Reset */}
      <div className="flex gap-2">
        <button
          onClick={onStop}
          disabled={!isRunning}
          className="flex-1 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-600/40 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 text-sm font-semibold transition-all"
        >
          ⏹ Stop
        </button>
        <button
          onClick={onReset}
          disabled={isRunning}
          className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-sm font-semibold transition-all"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
