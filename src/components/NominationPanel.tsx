import type { Player } from '../types';

interface Props {
  player: Player | null;
  onNext: () => void;
  loading: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  Batsman: '#f59e0b',
  Bowler: '#3b82f6',
  'All-Rounder': '#8b5cf6',
  'Wicket Keeper': '#10b981',
};

const ORIGIN_BADGE: Record<string, string> = {
  Indian: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  Overseas: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
};

const SET_LABEL: Record<string, string> = {
  marquee: 'MARQUEE',
  capped: 'CAPPED',
  uncapped: 'UNCAPPED',
  accelerated: 'ACCELERATED',
};

export default function NominationPanel({ player, onNext, loading }: Props) {
  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
        <span className="text-5xl">🏏</span>
        <p className="text-lg">No player nominated yet</p>
        <p className="text-sm">Click Next Player to begin</p>
      </div>
    );
  }

  const roleColor = ROLE_COLORS[player.role] ?? '#94a3b8';
  const setLabel = SET_LABEL[player.set_type] ?? player.set_type.toUpperCase();
  const progress = player.total_in_pool > 0
    ? Math.round((player.index_in_pool / player.total_in_pool) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Live Nomination Console
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {player.index_in_pool + 1} / {player.total_in_pool}
          </span>
          <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 p-5 flex flex-col gap-4 relative overflow-hidden">
        {/* Glow effect based on role */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none rounded-xl"
          style={{ background: `radial-gradient(circle at 30% 20%, ${roleColor}, transparent 60%)` }}
        />

        {/* Set badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded bg-slate-700 text-slate-300">
            {setLabel} SET
          </span>
        </div>

        {/* Player name + role */}
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{player.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-semibold" style={{ color: roleColor }}>{player.role}</span>
            {player.batting_category && (
              <span className="text-xs text-slate-400">· {player.batting_category}</span>
            )}
            {player.bowling_category && (
              <span className="text-xs text-slate-400">· {player.bowling_category}</span>
            )}
          </div>
        </div>

        {/* Origin + base price row */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORIGIN_BADGE[player.origin] ?? 'bg-slate-700 text-slate-300'}`}>
            {player.origin}
          </span>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">Base Price</span>
            <span className="text-lg font-bold text-emerald-400">
              ₹{player.base_price_cr >= 1 ? `${player.base_price_cr}Cr` : `${(player.base_price_cr * 100).toFixed(0)}L`}
            </span>
          </div>
          {player.avg_price_cr != null && (
            <div className="flex flex-col">
              <span className="text-xs text-slate-500">Historical Avg</span>
              <span className="text-sm font-semibold text-slate-300">₹{player.avg_price_cr.toFixed(2)}Cr</span>
            </div>
          )}
        </div>

        {/* Price history */}
        {player.historical_prices && player.historical_prices.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-1.5">Recent History</p>
            <div className="flex flex-col gap-1">
              {player.historical_prices.slice(-4).reverse().map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-slate-700/50 rounded px-2 py-1">
                  <span className="text-slate-400">{h.year}</span>
                  <span className="text-slate-300 truncate max-w-[120px]">{h.team}</span>
                  <span className="text-amber-400 font-semibold">₹{h.amount_cr}Cr</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Next player button */}
      <button
        onClick={onNext}
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold text-sm transition-all active:scale-95"
      >
        {loading ? 'Loading…' : 'Next Player →'}
      </button>
    </div>
  );
}
