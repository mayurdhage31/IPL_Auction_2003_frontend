import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { SimulationResult, PriceDistribution } from '../types';

interface Props {
  results: SimulationResult | null;
  simStatus: { running: boolean; mode: string; progress: number };
}

const PERCENTILE_COLORS: Record<string, string> = {
  min_cr:    '#475569',
  p10_cr:    '#64748b',
  p25_cr:    '#3b82f6',
  median_cr: '#f59e0b',
  p75_cr:    '#8b5cf6',
  p90_cr:    '#ec4899',
  max_cr:    '#ef4444',
};

const PERCENTILE_KEYS = ['min_cr', 'p10_cr', 'p25_cr', 'median_cr', 'p75_cr', 'p90_cr', 'max_cr'] as const;
const PERCENTILE_LABELS: Record<string, string> = {
  min_cr: 'Min', p10_cr: 'P10', p25_cr: 'P25', median_cr: 'Med',
  p75_cr: 'P75', p90_cr: 'P90', max_cr: 'Max',
};

// ── Single-player detail view ──────────────────────────────────────────────
function SinglePlayerView({ d }: { d: PriceDistribution }) {
  const chartData = PERCENTILE_KEYS.map(k => ({
    label: PERCENTILE_LABELS[k],
    value: Number((d as unknown as Record<string, number>)[k].toFixed(2)),
    key: k,
  }));

  const topTeams = Object.entries(d.team_win_probabilities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-3">
      {/* Summary stat tiles */}
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { label: 'Runs',    value: d.n_runs.toLocaleString() },
          { label: 'Sold',    value: `${(100 - d.unsold_probability * 100).toFixed(0)}%` },
          { label: 'Median',  value: `₹${d.median_cr.toFixed(2)}Cr` },
          { label: 'Unsold',  value: `${(d.unsold_probability * 100).toFixed(0)}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-center">
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</div>
            <div className="text-xs font-bold text-white mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* Extended percentile stats */}
      <div className="grid grid-cols-7 gap-1">
        {(['min_cr','p10_cr','p25_cr','median_cr','p75_cr','p90_cr','max_cr'] as const).map(k => (
          <div key={k} className="bg-slate-800/60 rounded p-1.5 text-center">
            <div className="text-[9px] text-slate-500 uppercase">{PERCENTILE_LABELS[k]}</div>
            <div className="text-[10px] font-bold text-slate-200">
              {(d as unknown as Record<string, number>)[k].toFixed(1)}
            </div>
          </div>
        ))}
      </div>

      {/* Percentile bar chart */}
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Price Distribution (₹Cr)</p>
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={chartData} margin={{ top: 2, right: 6, left: -10, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}`} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(v) => [`₹${Number(v).toFixed(2)}Cr`, 'Price']}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={PERCENTILE_COLORS[entry.key]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* IQR price band */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2.5">
        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Price Band (IQR)</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 text-[10px] w-8">{d.min_cr.toFixed(1)}</span>
          <div className="flex-1 relative h-3 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-amber-500/50 rounded"
              style={{
                left: d.max_cr > 0 ? `${(d.p25_cr / d.max_cr) * 100}%` : '0%',
                width: d.max_cr > 0 ? `${((d.p75_cr - d.p25_cr) / d.max_cr) * 100}%` : '0%',
              }}
            />
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
              style={{ left: d.max_cr > 0 ? `${(d.median_cr / d.max_cr) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-slate-500 text-[10px] w-8 text-right">{d.max_cr.toFixed(1)}</span>
        </div>
        <div className="text-center text-[10px] text-amber-400 mt-1 font-semibold">
          ₹{d.p25_cr.toFixed(2)} – ₹{d.p75_cr.toFixed(2)}Cr
        </div>
      </div>

      {/* Team win probabilities */}
      {topTeams.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Win Probability by Franchise</p>
          <div className="flex flex-col gap-1">
            {topTeams.map(([team, prob]) => (
              <div key={team} className="flex items-center gap-2">
                <span className="w-9 text-[10px] font-bold text-slate-300">{team}</span>
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${prob * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 w-8 text-right">{(prob * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Multi-player comparison view (set / full auction) ─────────────────────
function MultiPlayerView({
  distributions,
  mode,
}: {
  distributions: PriceDistribution[];
  mode: string;
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>(distributions[0]?.player_name ?? '');

  const sorted = [...distributions].sort((a, b) => b.median_cr - a.median_cr).slice(0, 20);
  const selected = distributions.find(d => d.player_name === selectedPlayer);

  const chartData = sorted.map(d => ({
    name: d.player_name.split(' ').slice(-1)[0],
    fullName: d.player_name,
    median: d.median_cr,
    p25: d.p25_cr,
    p75: d.p75_cr,
    unsold: Math.round(d.unsold_probability * 100),
  }));

  const isFullAuction = mode === 'full_auction';

  return (
    <div className="flex flex-col gap-3">
      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-center">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Players</div>
          <div className="text-xs font-bold text-white mt-0.5">{distributions.length}</div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-center">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Avg Median</div>
          <div className="text-xs font-bold text-amber-400 mt-0.5">
            ₹{(distributions.reduce((s, d) => s + d.median_cr, 0) / distributions.length).toFixed(2)}Cr
          </div>
        </div>
        <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-2 text-center">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Avg Unsold</div>
          <div className="text-xs font-bold text-red-400 mt-0.5">
            {(distributions.reduce((s, d) => s + d.unsold_probability, 0) / distributions.length * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Full auction extra context */}
      {isFullAuction && (
        <div className="rounded-lg bg-slate-800/40 border border-slate-700/60 px-3 py-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Full Auction — Top outcomes</p>
          <p className="text-[10px] text-slate-400">
            Showing median hammer prices across all {distributions.length} players.
            Click any bar or use the dropdown to drill into a player's distribution.
          </p>
        </div>
      )}

      {/* Median price bar chart — top 20 by median */}
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">
          Median Price — {isFullAuction ? 'Top 20 Players' : 'All Players in Set'}
        </p>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={chartData} margin={{ top: 2, right: 6, left: -10, bottom: 28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 9 }}
              angle={-40}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} tickFormatter={v => `${v}Cr`} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
              formatter={(v, _name, props) => [
                `₹${Number(v).toFixed(2)}Cr`,
                (props?.payload as { fullName?: string })?.fullName ?? String(_name),
              ]}
            />
            <Bar
              dataKey="median"
              fill="#f59e0b"
              radius={[3, 3, 0, 0]}
              onClick={(data) => setSelectedPlayer((data as unknown as { fullName: string }).fullName)}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Player detail drilldown */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide shrink-0">Drill-down:</p>
          <select
            className="bg-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 border border-slate-600 flex-1 focus:outline-none focus:border-amber-500"
            value={selectedPlayer}
            onChange={e => setSelectedPlayer(e.target.value)}
          >
            {[...distributions].sort((a, b) => b.median_cr - a.median_cr).map(d => (
              <option key={d.player_name} value={d.player_name}>
                {d.player_name} — ₹{d.median_cr.toFixed(2)}Cr median
              </option>
            ))}
          </select>
        </div>
        {selected && (
          <div className="border-t border-slate-700/50 pt-3">
            <p className="text-xs font-semibold text-white mb-2">{selected.player_name}</p>
            <SinglePlayerView d={selected} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Root export ────────────────────────────────────────────────────────────
export default function ResultsChart({ results, simStatus }: Props) {
  if (simStatus.running) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <div>
          <p className="text-sm text-slate-300 font-semibold capitalize">
            {simStatus.mode.replace(/_/g, ' ')} simulation
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{simStatus.progress}% complete</p>
        </div>
      </div>
    );
  }

  if (!results || !results.distributions?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
        <span className="text-4xl">📊</span>
        <p className="text-sm font-semibold text-slate-500">No results yet</p>
        <p className="text-xs text-slate-600">Run a simulation using the controls on the left</p>
      </div>
    );
  }

  const { distributions, mode, n_runs, duration_ms } = results;

  return (
    <div className="flex flex-col gap-3">
      {/* Result header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
            Results
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600 capitalize">
            {mode.replace(/_/g, ' ')}
          </span>
        </div>
        <span className="text-[10px] text-slate-500">
          {n_runs.toLocaleString()} runs · {duration_ms.toFixed(0)}ms
        </span>
      </div>

      {distributions.length === 1 ? (
        <>
          <p className="text-sm font-semibold text-white">{distributions[0].player_name}</p>
          <SinglePlayerView d={distributions[0]} />
        </>
      ) : (
        <MultiPlayerView distributions={distributions} mode={mode} />
      )}
    </div>
  );
}
