import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import type { SimulationResult, PriceDistribution } from '../types';

interface Props {
  results: SimulationResult | null;
  simStatus: { running: boolean; mode: string };
}

const PERCENTILE_COLORS: Record<string, string> = {
  min_cr: '#475569',
  p10_cr: '#64748b',
  p25_cr: '#3b82f6',
  median_cr: '#f59e0b',
  mean_cr: '#f97316',
  p75_cr: '#8b5cf6',
  p90_cr: '#ec4899',
  max_cr: '#ef4444',
};

const PERCENTILE_KEYS = ['min_cr', 'p10_cr', 'p25_cr', 'median_cr', 'p75_cr', 'p90_cr', 'max_cr'] as const;
const PERCENTILE_LABELS: Record<string, string> = {
  min_cr: 'Min', p10_cr: 'P10', p25_cr: 'P25', median_cr: 'Median',
  p75_cr: 'P75', p90_cr: 'P90', max_cr: 'Max',
};

function SinglePlayerView({ d }: { d: PriceDistribution }) {
  const chartData = PERCENTILE_KEYS.map(k => ({
    label: PERCENTILE_LABELS[k],
    value: Number((d as any)[k].toFixed(2)),
    key: k,
  }));

  const topTeams = Object.entries(d.team_win_probabilities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Runs', value: d.n_runs },
          { label: 'Sold', value: `${d.sold_count} (${(100 - d.unsold_probability * 100).toFixed(0)}%)` },
          { label: 'Median', value: `₹${d.median_cr.toFixed(2)}Cr` },
          { label: 'Unsold %', value: `${(d.unsold_probability * 100).toFixed(0)}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-800 rounded-lg p-2 text-center">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-sm font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Percentile bar chart */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Price Distribution (Crores)</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}Cr`} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(v) => [`₹${Number(v).toFixed(2)}Cr`, 'Price']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.key} fill={PERCENTILE_COLORS[entry.key]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Range band visual */}
      <div className="bg-slate-800/60 rounded-lg p-3">
        <p className="text-xs text-slate-500 mb-2">Price Band</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">{d.min_cr.toFixed(1)}</span>
          <div className="flex-1 relative h-4 bg-slate-700 rounded-full overflow-hidden">
            {/* P25-P75 band */}
            <div
              className="absolute top-0 bottom-0 bg-amber-500/60 rounded"
              style={{
                left: d.max_cr > 0 ? `${(d.p25_cr / d.max_cr) * 100}%` : '0%',
                width: d.max_cr > 0 ? `${((d.p75_cr - d.p25_cr) / d.max_cr) * 100}%` : '0%',
              }}
            />
            {/* Median marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400"
              style={{ left: d.max_cr > 0 ? `${(d.median_cr / d.max_cr) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-slate-500">{d.max_cr.toFixed(1)}</span>
        </div>
        <div className="text-center text-xs text-amber-400 mt-1">
          ₹{d.p25_cr.toFixed(2)} – ₹{d.p75_cr.toFixed(2)}Cr (IQR)
        </div>
      </div>

      {/* Team win probabilities */}
      {topTeams.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 mb-2">Win Probability by Team</p>
          <div className="flex flex-col gap-1.5">
            {topTeams.map(([team, prob]) => (
              <div key={team} className="flex items-center gap-2">
                <span className="w-10 text-xs font-bold text-slate-300">{team}</span>
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${prob * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-10 text-right">{(prob * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MultiPlayerView({ distributions }: { distributions: PriceDistribution[] }) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>(distributions[0]?.player_name ?? '');

  const sorted = [...distributions].sort((a, b) => b.median_cr - a.median_cr).slice(0, 20);
  const selected = distributions.find(d => d.player_name === selectedPlayer);

  const chartData = sorted.map(d => ({
    name: d.player_name.split(' ').slice(-1)[0], // surname only for space
    fullName: d.player_name,
    p25: d.p25_cr,
    iqr: Math.max(0, d.p75_cr - d.p25_cr),
    median: d.median_cr,
    unsold: Math.round(d.unsold_probability * 100),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-800 rounded-lg p-2">
          <div className="text-xs text-slate-500">Players</div>
          <div className="text-sm font-bold text-white">{distributions.length}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-2">
          <div className="text-xs text-slate-500">Avg Median</div>
          <div className="text-sm font-bold text-amber-400">
            ₹{(distributions.reduce((s, d) => s + d.median_cr, 0) / distributions.length).toFixed(2)}Cr
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-2">
          <div className="text-xs text-slate-500">Avg Unsold</div>
          <div className="text-sm font-bold text-red-400">
            {(distributions.reduce((s, d) => s + d.unsold_probability, 0) / distributions.length * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Price range bar chart */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Median Price — Top 20 Players</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}Cr`} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              formatter={(v, _name, props) => [
                `₹${Number(v).toFixed(2)}Cr`, (props?.payload as any)?.fullName ?? _name
              ]}
            />
            <Bar dataKey="median" fill="#f59e0b" radius={[3, 3, 0, 0]}
              onClick={(data) => setSelectedPlayer((data as any).fullName)}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Player selector + detail */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs text-slate-500">Detail view:</p>
          <select
            className="bg-slate-700 text-slate-200 text-xs rounded px-2 py-1 border border-slate-600 flex-1"
            value={selectedPlayer}
            onChange={e => setSelectedPlayer(e.target.value)}
          >
            {distributions.map(d => (
              <option key={d.player_name} value={d.player_name}>{d.player_name}</option>
            ))}
          </select>
        </div>
        {selected && <SinglePlayerView d={selected} />}
      </div>
    </div>
  );
}

export default function ResultsChart({ results, simStatus }: Props) {
  if (simStatus.running) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Simulating… {simStatus.mode.replace('_', ' ')}</p>
      </div>
    );
  }

  if (!results || !results.distributions?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-600 gap-2">
        <span className="text-3xl">📊</span>
        <p className="text-sm">Run a simulation to see price distributions</p>
      </div>
    );
  }

  const { distributions } = results;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Simulation Results
        </span>
        <span className="text-xs text-slate-500">
          {results.n_runs} runs · {results.duration_ms.toFixed(0)}ms
        </span>
      </div>

      {distributions.length === 1 ? (
        <div>
          <p className="text-sm font-semibold text-white mb-3">{distributions[0].player_name}</p>
          <SinglePlayerView d={distributions[0]} />
        </div>
      ) : (
        <MultiPlayerView distributions={distributions} />
      )}
    </div>
  );
}
