import { useState, useEffect } from 'react';
import type { Player, TeamInfo, SetTotals } from '../types';

interface Props {
  player: Player | null;
  teams: TeamInfo[];
  onNext: () => void;
  onSell: (teamCode: string, priceCr: number) => Promise<void>;
  onMarkUnsold: () => Promise<void>;
  loading: boolean;
  setTotals?: SetTotals;
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

const SET_BADGE: Record<string, string> = {
  marquee: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  capped: 'bg-slate-600/60 text-slate-300 border border-slate-500/40',
  uncapped: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  accelerated: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
};

const SET_LABEL: Record<string, string> = {
  marquee: 'MARQUEE',
  capped: 'CAPPED',
  uncapped: 'UNCAPPED',
  accelerated: 'ACCELERATED',
};

export default function NominationPanel({ player, teams, onNext, onSell, onMarkUnsold, loading, setTotals }: Props) {
  // Live assignment state — reset whenever the nominated player changes
  const [sellTeam, setSellTeam] = useState<string>('');
  const [sellPrice, setSellPrice] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // When player changes, pre-fill defaults
  useEffect(() => {
    if (player) {
      setSellTeam(teams[0]?.code ?? '');
      // Default price = base price; user can override
      setSellPrice(player.base_price_cr.toString());
    }
  }, [player?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 p-6">
        <span className="text-5xl">🏏</span>
        <p className="text-base font-semibold">No player nominated yet</p>
        <button
          onClick={onNext}
          disabled={loading}
          className="mt-1 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold text-sm transition-all active:scale-95"
        >
          {loading ? 'Loading…' : 'Nominate First Player →'}
        </button>
      </div>
    );
  }

  const roleColor = ROLE_COLORS[player.role] ?? '#94a3b8';
  const setLabel = SET_LABEL[player.set_type] ?? player.set_type.toUpperCase();
  const setBadge = SET_BADGE[player.set_type] ?? 'bg-slate-700 text-slate-300 border border-slate-600';
  const progress = player.total_in_pool > 0
    ? Math.round((player.index_in_pool / player.total_in_pool) * 100)
    : 0;

  // Intra-set progress
  let setIndex: number | null = null;
  let setTotal: number | null = null;
  if (setTotals) {
    if (player.set_type === 'marquee') {
      setIndex = player.index_in_pool + 1;
      setTotal = setTotals.marquee;
    } else if (player.set_type === 'capped') {
      setIndex = player.index_in_pool - setTotals.marquee + 1;
      setTotal = setTotals.capped;
    } else if (player.set_type === 'uncapped') {
      setIndex = player.index_in_pool - setTotals.marquee - setTotals.capped + 1;
      setTotal = setTotals.uncapped;
    }
  }

  // Inline price validation
  const priceVal = parseFloat(sellPrice);
  const priceError = sellPrice !== '' && !isNaN(priceVal) && priceVal < player.base_price_cr;

  // Outcome: if already resolved, show a result banner instead of the sell controls
  const outcome = player.outcome ?? null;
  const isResolved = outcome !== null;

  const handleSell = async () => {
    const price = parseFloat(sellPrice);
    if (!sellTeam || isNaN(price) || price <= 0 || price < player.base_price_cr) return;
    setActionLoading(true);
    try {
      await onSell(sellTeam, price);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsold = async () => {
    setActionLoading(true);
    try {
      await onMarkUnsold();
    } finally {
      setActionLoading(false);
    }
  };

  const busy = loading || actionLoading;

  return (
    <div className="h-full flex flex-col">
      {/* Section label + progress bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
          Live Nomination Console
        </span>
        <div className="flex items-center gap-3">
          {/* Intra-set progress label */}
          {setIndex !== null && setTotal !== null && (
            <span className="text-[10px] text-slate-400 font-medium">
              <span className="text-slate-600">{setLabel} set </span>
              {setIndex}/{setTotal}
            </span>
          )}
          <span className="text-[10px] text-slate-500">
            {player.index_in_pool + 1} / {player.total_in_pool}
          </span>
          <div className="w-20 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Main content card */}
      <div
        className="flex-1 mx-4 mb-3 rounded-xl border border-slate-700 bg-slate-800/40 overflow-hidden relative"
        style={{ minHeight: 0 }}
      >
        {/* Subtle role-coloured glow */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 20% 40%, ${roleColor}, transparent 55%)` }}
        />

        <div className="flex h-full">
          {/* LEFT: Player identity + action controls */}
          <div className="flex-1 flex flex-col justify-between p-4 border-r border-slate-700/60 min-w-0">

            {/* Set badge + origin */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full ${setBadge}`}>
                {setLabel}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ORIGIN_BADGE[player.origin] ?? 'bg-slate-700 text-slate-300'}`}>
                {player.origin}
              </span>
            </div>

            {/* Player name + role */}
            <div className="mt-2">
              <h2 className="text-xl font-bold text-white tracking-tight leading-tight truncate">{player.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-sm font-semibold" style={{ color: roleColor }}>{player.role}</span>
                {player.batting_category && (
                  <span className="text-xs text-slate-400">· {player.batting_category}</span>
                )}
                {player.bowling_category && (
                  <span className="text-xs text-slate-400">· {player.bowling_category}</span>
                )}
              </div>
            </div>

            {/* Pricing row — Base Price and Hist. Avg are clearly separate labels */}
            <div className="flex items-end gap-4 mt-2">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Base Price</p>
                <p className="text-xl font-bold text-emerald-400 leading-tight">
                  {player.base_price_cr >= 1
                    ? `₹${player.base_price_cr}Cr`
                    : `₹${(player.base_price_cr * 100).toFixed(0)}L`}
                </p>
              </div>
              {player.avg_price_cr != null && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Hist. Avg</p>
                  <p className="text-sm font-semibold text-slate-300">₹{player.avg_price_cr.toFixed(2)}Cr</p>
                </div>
              )}
            </div>

            {/* ── OUTCOME or SELL CONTROLS ── */}
            <div className="mt-3">
              {isResolved ? (
                /* Already resolved — show result banner */
                <div className={`rounded-lg px-3 py-2.5 border ${
                  outcome!.status === 'sold'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-700/60 border-slate-600'
                }`}>
                  {outcome!.status === 'sold' ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">Sold</span>
                      <span className="text-xs font-bold text-white">{outcome!.team_code}</span>
                      <span className="text-xs text-slate-400">at</span>
                      <span className="text-sm font-bold text-emerald-400">₹{outcome!.price_cr}Cr</span>
                      <span className="text-[10px] text-slate-500 ml-auto">Live auction</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Unsold</span>
                      <span className="text-[10px] text-slate-500 ml-auto">Live auction</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Not yet resolved — show sell controls */
                <div className="space-y-2">
                  {/* Label clarifying this is live, not simulation */}
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                    Live Assignment — confirm result
                  </p>

                  <div className="flex gap-2">
                    {/* Team selector */}
                    <select
                      value={sellTeam}
                      onChange={e => setSellTeam(e.target.value)}
                      disabled={busy}
                      className="flex-1 bg-slate-700 border border-slate-600 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 disabled:opacity-50 min-w-0"
                    >
                      {teams.map(t => (
                        <option key={t.code} value={t.code}>{t.code} — ₹{t.remaining_purse_cr.toFixed(1)}Cr</option>
                      ))}
                    </select>

                    {/* Hammer price input */}
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">₹</span>
                      <input
                        type="number"
                        min={player.base_price_cr}
                        step={0.25}
                        value={sellPrice}
                        onChange={e => setSellPrice(e.target.value)}
                        disabled={busy}
                        placeholder={player.base_price_cr.toString()}
                        className={`w-full bg-slate-700 border text-white text-xs rounded-lg pl-5 pr-6 py-1.5 focus:outline-none disabled:opacity-50 ${
                          priceError
                            ? 'border-red-500 focus:border-red-400'
                            : 'border-slate-600 focus:border-emerald-500'
                        }`}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">Cr</span>
                    </div>
                  </div>

                  {/* Inline price validation error */}
                  {priceError && (
                    <p className="text-[10px] text-red-400 -mt-1">
                      Hammer price cannot be below base price (₹{player.base_price_cr}Cr)
                    </p>
                  )}

                  <div className="flex gap-2">
                    {/* Sell / Assign button */}
                    <button
                      onClick={handleSell}
                      disabled={busy || !sellTeam || !sellPrice || priceError}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all active:scale-95"
                    >
                      {actionLoading ? 'Assigning…' : '✓ Sell Player'}
                    </button>

                    {/* Mark Unsold button */}
                    <button
                      onClick={handleUnsold}
                      disabled={busy}
                      className="flex-1 py-1.5 rounded-lg bg-slate-600/80 hover:bg-slate-600 border border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-bold transition-all active:scale-95"
                    >
                      Unsold
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Next player button — always available */}
            <button
              onClick={onNext}
              disabled={busy}
              className="mt-2 w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-amber-400 font-bold text-xs transition-all active:scale-95"
            >
              {loading ? 'Loading…' : 'Next Player →'}
            </button>
          </div>

          {/* RIGHT: Price history */}
          <div className="w-48 flex flex-col p-4 shrink-0">
            <p className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase mb-2">
              Auction History
            </p>
            {player.historical_prices && player.historical_prices.length > 0 ? (
              <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
                {player.historical_prices.slice().reverse().map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs bg-slate-700/50 rounded-lg px-2 py-1.5"
                  >
                    <span className="text-slate-400 w-9 shrink-0">{h.year}</span>
                    <span className="text-slate-300 truncate flex-1 mx-1 text-center text-[10px]">
                      {h.team_code ?? h.team}
                    </span>
                    <span className="text-amber-400 font-bold shrink-0 text-[10px]">₹{h.amount_cr}Cr</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-600 text-xs text-center">
                No auction history
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
