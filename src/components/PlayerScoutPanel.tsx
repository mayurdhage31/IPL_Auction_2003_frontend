import { useState, useEffect, useCallback } from 'react';
import { getPlayersForTeam, getPlayerDetail } from '../services/api';
import type { TeamInfo, PlayerSummary, PlayerDetail } from '../types';

interface Props {
  teams: TeamInfo[];
}

const ROLE_COLOR: Record<string, string> = {
  Batsman: 'text-amber-400',
  Bowler: 'text-blue-400',
  'All-Rounder': 'text-purple-400',
  'Wicket Keeper': 'text-emerald-400',
};

const ROLE_BG: Record<string, string> = {
  Batsman: 'bg-amber-400/15 border-amber-400/30',
  Bowler: 'bg-blue-400/15 border-blue-400/30',
  'All-Rounder': 'bg-purple-400/15 border-purple-400/30',
  'Wicket Keeper': 'bg-emerald-400/15 border-emerald-400/30',
};

const TRAJECTORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  rising_star: { label: 'Rising', color: 'text-emerald-400', icon: '↑' },
  declining: { label: 'Declining', color: 'text-red-400', icon: '↓' },
  stable: { label: 'Stable', color: 'text-amber-400', icon: '→' },
  unknown: { label: 'Unknown', color: 'text-slate-500', icon: '?' },
};

function StatTile({ label, value, color = 'text-white' }: { label: string; value: string | number | null; color?: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-2.5 text-center">
      <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{value ?? '—'}</div>
    </div>
  );
}

function PlayerProfileCard({ detail }: { detail: PlayerDetail }) {
  const traj = TRAJECTORY_CONFIG[detail.trajectory ?? 'unknown'] ?? TRAJECTORY_CONFIG.unknown;
  const hasBatting = detail.batting_avg != null || detail.batting_sr != null || detail.total_runs != null;
  const hasBowling = detail.wickets != null || detail.economy != null || detail.bowling_sr != null;

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* Header */}
      <div className={`rounded-xl border p-4 ${ROLE_BG[detail.role] ?? 'bg-slate-800/40 border-slate-700'}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{detail.name}</h2>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className={`text-xs font-semibold ${ROLE_COLOR[detail.role] ?? 'text-slate-400'}`}>
                {detail.role}
              </span>
              {detail.batting_category && (
                <span className="text-[10px] text-slate-500">· {detail.batting_category}</span>
              )}
              {detail.bowling_category && (
                <span className="text-[10px] text-slate-500">· {detail.bowling_category}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              detail.origin === 'Indian'
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
            }`}>
              {detail.origin === 'Indian' ? '🇮🇳 Indian' : '🌍 Overseas'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 border border-slate-600 text-slate-400 uppercase tracking-wide">
              {detail.set_type}
            </span>
          </div>
        </div>

        {/* Price summary row */}
        <div className="flex items-center gap-4 mt-2">
          <div>
            <span className="text-[10px] text-slate-500">Base Price</span>
            <p className="text-sm font-bold text-emerald-400">
              {detail.base_price_cr >= 1
                ? `₹${detail.base_price_cr}Cr`
                : `₹${Math.round(detail.base_price_cr * 100)}L`}
            </p>
          </div>
          <div>
            <span className="text-[10px] text-slate-500">Avg Price</span>
            <p className="text-sm font-bold text-amber-400">₹{detail.avg_price_cr?.toFixed(2)}Cr</p>
          </div>
          {detail.max_price_cr != null && (
            <div>
              <span className="text-[10px] text-slate-500">Peak</span>
              <p className="text-sm font-bold text-white">₹{detail.max_price_cr.toFixed(2)}Cr</p>
            </div>
          )}
          <div className="ml-auto text-right">
            <span className="text-[10px] text-slate-500">Trajectory</span>
            <p className={`text-sm font-bold ${traj.color}`}>
              {traj.icon} {traj.label}
            </p>
          </div>
        </div>
      </div>

      {/* Auction stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Appearances" value={detail.auction_appearances} color="text-white" />
        <StatTile label="Teams" value={detail.total_teams} color="text-white" />
        <StatTile label="Latest Year" value={detail.latest_year} color="text-slate-300" />
      </div>

      {/* Batting stats */}
      {hasBatting && (
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Batting
          </p>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Avg" value={detail.batting_avg != null ? detail.batting_avg.toFixed(1) : null} color="text-amber-400" />
            <StatTile label="Strike Rate" value={detail.batting_sr != null ? detail.batting_sr.toFixed(1) : null} color="text-amber-300" />
            <StatTile label="Runs" value={detail.total_runs} color="text-white" />
          </div>
        </div>
      )}

      {/* Bowling stats */}
      {hasBowling && (
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Bowling
          </p>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Wickets" value={detail.wickets} color="text-blue-400" />
            <StatTile label="Economy" value={detail.economy != null ? detail.economy.toFixed(2) : null} color="text-blue-300" />
            <StatTile label="Bowl SR" value={detail.bowling_sr != null ? detail.bowling_sr.toFixed(1) : null} color="text-white" />
          </div>
        </div>
      )}

      {/* Full price history */}
      {detail.historical_prices && detail.historical_prices.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Price History
          </p>
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-800 text-slate-500">
                  <th className="px-3 py-1.5 text-left font-medium">Year</th>
                  <th className="px-3 py-1.5 text-left font-medium">Team</th>
                  <th className="px-3 py-1.5 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {[...detail.historical_prices].reverse().map((h, i) => (
                  <tr
                    key={i}
                    className={`border-t border-slate-700/60 ${i === 0 ? 'bg-slate-800/40' : ''}`}
                  >
                    <td className="px-3 py-1.5 text-slate-400">{h.year}</td>
                    <td className="px-3 py-1.5 text-slate-300 truncate max-w-[120px]">{h.team}</td>
                    <td className="px-3 py-1.5 text-right font-semibold text-amber-400">
                      ₹{h.amount_cr.toFixed(2)}Cr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayerScoutPanel({ teams }: Props) {
  const [scoutTeam, setScoutTeam] = useState<string>('CSK');
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [playerDetail, setPlayerDetail] = useState<PlayerDetail | null>(null);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async (teamCode: string) => {
    setLoadingPlayers(true);
    setSelectedPlayer('');
    setPlayerDetail(null);
    setError(null);
    try {
      const data = await getPlayersForTeam(teamCode);
      setPlayers(data);
    } catch {
      setError('Failed to load players for this team.');
    } finally {
      setLoadingPlayers(false);
    }
  }, []);

  const fetchDetail = useCallback(async (name: string) => {
    if (!name) return;
    setLoadingDetail(true);
    setError(null);
    try {
      const data = await getPlayerDetail(name);
      setPlayerDetail(data);
    } catch {
      setError(`Failed to load details for ${name}.`);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => { fetchPlayers(scoutTeam); }, [scoutTeam, fetchPlayers]);
  useEffect(() => { if (selectedPlayer) fetchDetail(selectedPlayer); }, [selectedPlayer, fetchDetail]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Player Scout
        </span>
        <p className="text-[10px] text-slate-600 mt-0.5">
          Select a team to browse its historical players, then pick a player to view their full profile.
        </p>
      </div>

      {/* Team selector */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-1">
          Team
        </label>
        <select
          className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
          value={scoutTeam}
          onChange={e => setScoutTeam(e.target.value)}
        >
          {teams.map(t => (
            <option key={t.code} value={t.code}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Player selector */}
      <div>
        <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block mb-1">
          Player {players.length > 0 && <span className="text-slate-600 normal-case">({players.length} found)</span>}
        </label>
        {loadingPlayers ? (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
            <div className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin" />
            Loading players…
          </div>
        ) : (
          <select
            className="w-full bg-slate-800 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
            value={selectedPlayer}
            onChange={e => setSelectedPlayer(e.target.value)}
            disabled={players.length === 0}
          >
            <option value="">— Select a player —</option>
            {players.map(p => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.role}, ₹{p.avg_price_cr.toFixed(1)}Cr avg)
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Player detail */}
      {loadingDetail && (
        <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading player profile…</span>
        </div>
      )}

      {!loadingDetail && playerDetail && (
        <PlayerProfileCard detail={playerDetail} />
      )}

      {!loadingDetail && !playerDetail && !loadingPlayers && selectedPlayer === '' && players.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-600 gap-2">
          <span className="text-3xl">🔎</span>
          <p className="text-sm">Select a player above to see their full profile</p>
        </div>
      )}
    </div>
  );
}
