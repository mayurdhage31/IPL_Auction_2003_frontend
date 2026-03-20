import type { TeamSquad, TeamInfo } from '../types';

interface Props {
  squad: TeamSquad | null;
  teams: TeamInfo[];
  selectedTeam: string;
  onSelectTeam: (code: string) => void;
}

const ROLE_DOT: Record<string, string> = {
  Batsman: 'bg-amber-400',
  Bowler: 'bg-blue-400',
  'All-Rounder': 'bg-purple-400',
  'Wicket Keeper': 'bg-emerald-400',
};

export default function SquadPanel({ squad, teams, selectedTeam, onSelectTeam }: Props) {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Team selector */}
      <div>
        <label className="text-xs font-semibold tracking-widest text-slate-400 uppercase block mb-2">
          Franchise
        </label>
        <select
          className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          value={selectedTeam}
          onChange={e => onSelectTeam(e.target.value)}
        >
          {teams.map(t => (
            <option key={t.code} value={t.code}>{t.name}</option>
          ))}
        </select>
      </div>

      {squad ? (
        <>
          {/* Purse display */}
          <div className="rounded-xl bg-slate-800/70 border border-slate-700 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-500">Remaining Purse</span>
              <span className="text-xl font-bold text-emerald-400">₹{squad.remaining_purse_cr}Cr</span>
            </div>
            <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(squad.remaining_purse_cr / squad.total_purse_cr) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>₹0Cr</span>
              <span>₹{squad.total_purse_cr}Cr</span>
            </div>
          </div>

          {/* Role counters */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Batsmen', value: squad.counters.batsmen, color: 'text-amber-400' },
              { label: 'Bowlers', value: squad.counters.bowlers, color: 'text-blue-400' },
              { label: 'All-Rounders', value: squad.counters.allrounders, color: 'text-purple-400' },
              { label: 'Wicketkeepers', value: squad.counters.wicketkeepers, color: 'text-emerald-400' },
              { label: 'Indians', value: squad.counters.indians, color: 'text-orange-400' },
              {
                label: 'Overseas',
                value: `${squad.counters.overseas}/${squad.counters.overseas_max}`,
                color: squad.counters.overseas >= squad.counters.overseas_max
                  ? 'text-red-400' : 'text-cyan-400',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2">
                <div className="text-xs text-slate-500">{label}</div>
                <div className={`text-base font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Squad list */}
          <div className="flex-1 flex flex-col gap-1 overflow-y-auto min-h-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Squad
              </span>
              <span className="text-xs text-slate-500">
                {squad.squad.length} players
              </span>
            </div>

            {squad.squad.length === 0 ? (
              <div className="text-center text-slate-600 text-sm py-6">
                No players signed yet
              </div>
            ) : (
              squad.squad.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ROLE_DOT[p.role] ?? 'bg-slate-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500">{p.role}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-slate-500">
                      {p.origin === 'Overseas' ? '🌍' : '🇮🇳'}
                    </span>
                    {p.price_paid_cr != null && (
                      <p className="text-[10px] text-amber-400">₹{p.price_paid_cr}Cr</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
          Loading squad…
        </div>
      )}
    </div>
  );
}
