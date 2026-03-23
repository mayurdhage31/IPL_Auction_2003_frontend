import type { SimulationStatus, SimMode, RunCount } from '../types';

interface Props {
  simStatus: SimulationStatus;
  elapsedMs?: number;
  onSimulate: (mode: SimMode, nRuns: RunCount) => void;
  onStop: () => void;
  onReset: () => void;
  disabled: boolean;
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

const RUN_COUNTS: RunCount[] = [100, 500, 1000];

const MODE_CONFIG: { mode: SimMode; label: string; icon: string; desc: string }[] = [
  { mode: 'next_player', label: 'Next Player', icon: '🎯', desc: 'Current player only' },
  { mode: 'set',         label: 'Current Set', icon: '📦', desc: 'Entire current set'  },
  { mode: 'full_auction',label: 'Full Auction', icon: '🏆', desc: 'Complete auction'   },
];

export default function SimulationControls({ simStatus, elapsedMs = 0, onSimulate, onStop, onReset, disabled }: Props) {
  const isRunning = simStatus.running;

  return (
    // h-full so Stop/Reset pin to the bottom via mt-auto
    <div className="h-full flex flex-col gap-3 p-4">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
          Simulation Controls
        </span>
        {isRunning && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-semibold">Running</span>
          </div>
        )}
      </div>

      {/* Progress bar — shown while running */}
      {isRunning && (
        <div className="rounded-lg bg-slate-800 border border-slate-700 p-2.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="capitalize">{simStatus.mode.replace(/_/g, ' ')}</span>
            <span className="font-semibold text-emerald-400">{simStatus.progress}%</span>
          </div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${simStatus.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>{simStatus.current_run.toLocaleString()} / {simStatus.total_runs.toLocaleString()} runs</span>
            {elapsedMs > 0 && (
              <span className="text-slate-500">{formatElapsed(elapsedMs)}</span>
            )}
          </div>
        </div>
      )}

      {/* Mode buttons — 3 modes × 3 run counts */}
      <div className="flex flex-col gap-2">
        {MODE_CONFIG.map(({ mode, label, icon, desc }) => (
          <div key={mode} className="rounded-lg border border-slate-700 bg-slate-800/50 p-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">{icon}</span>
              <span className="text-xs font-semibold text-white">{label}</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-1.5">{desc}</p>
            <div className="flex gap-1">
              {RUN_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => onSimulate(mode, n)}
                  disabled={disabled || isRunning}
                  className="flex-1 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold text-slate-200 transition-all active:scale-95"
                >
                  {n >= 1000 ? '1k' : `${n}`}×
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Stop / Reset — pinned to bottom */}
      <div className="mt-auto flex gap-2 pt-2">
        <button
          onClick={onStop}
          disabled={!isRunning}
          className="flex-1 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-600/40 disabled:opacity-30 disabled:cursor-not-allowed text-red-400 text-xs font-bold transition-all"
        >
          ⏹ Stop
        </button>
        <button
          onClick={onReset}
          disabled={isRunning}
          className="flex-1 py-2 rounded-lg bg-slate-700/80 hover:bg-slate-600 border border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-xs font-bold transition-all"
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
