import { useState } from 'react';
import { useAuction } from '../hooks/useAuction';
import NominationPanel from '../components/NominationPanel';
import SimulationControls from '../components/SimulationControls';
import ResultsChart from '../components/ResultsChart';
import SquadPanel from '../components/SquadPanel';
import RAGPanel from '../components/RAGPanel';
import PlayerScoutPanel from '../components/PlayerScoutPanel';
import type { SimMode, RunCount } from '../types';

// Secondary panel toggle — replaces left pane when active
type LeftView = 'workspace' | 'scout' | 'rag';

export default function AuctionPage() {
  const {
    currentPlayer,
    auctionState,
    selectedTeam, setSelectedTeam,
    squad,
    simStatus,
    simElapsedMs,
    results,
    loading,
    error,
    unsoldHistory,
    nextPlayer,
    runSimulation,
    stop,
    reset,
    askRag,
    sellPlayer,
    markUnsold,
  } = useAuction();

  const [leftView, setLeftView] = useState<LeftView>('workspace');

  const toggleView = (view: LeftView) => {
    setLeftView(prev => (prev === view ? 'workspace' : view));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-lg">🏏</span>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-white">IPL Auction Simulator</h1>
            <p className="text-[10px] text-slate-500">Monte Carlo · 10 Franchise Agents · Gemini RAG</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Secondary panel toggles */}
          <button
            onClick={() => toggleView('scout')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              leftView === 'scout'
                ? 'border-amber-500/60 bg-amber-500/10 text-amber-400'
                : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🔎</span> Scout
          </button>
          <button
            onClick={() => toggleView('rag')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              leftView === 'rag'
                ? 'border-violet-500/60 bg-violet-500/10 text-violet-400'
                : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🤖</span> AI Research
          </button>

          {/* Auction progress counter */}
          {currentPlayer && (
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
              <span className="text-xs text-slate-500">Player</span>
              <span className="text-xs font-bold text-white">
                {currentPlayer.index_in_pool + 1} / {currentPlayer.total_in_pool}
              </span>
            </div>
          )}

          {/* Simulation running indicator */}
          {simStatus.running && (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-semibold">
                {simStatus.progress}%
              </span>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-1.5 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </header>

      {/* ── Main split layout ───────────────────────────────────────────────── */}
      <main
        className="flex-1 grid grid-cols-[1fr_310px] overflow-hidden"
        style={{ height: 'calc(100vh - 53px)' }}
      >
        {/* ── LEFT PANE ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col border-r border-slate-800 overflow-hidden">

          {/* ── Workspace view (default) ───────────────────────────────────── */}
          {leftView === 'workspace' && (
            <>
              {/* TOP: Nomination console — fixed height */}
              <div
                className="border-b border-slate-800 overflow-y-auto flex-shrink-0"
                style={{ height: '42%' }}
              >
                <NominationPanel
                  player={currentPlayer}
                  teams={auctionState?.teams ?? []}
                  onNext={nextPlayer}
                  onSell={sellPlayer}
                  onMarkUnsold={markUnsold}
                  loading={loading}
                  setTotals={auctionState?.set_totals}
                />
              </div>

              {/* BOTTOM: Sim controls (left) + Results (right) */}
              <div className="flex-1 grid grid-cols-[264px_1fr] overflow-hidden min-h-0">

                {/* Simulation Controls */}
                <div className="border-r border-slate-800 overflow-y-auto">
                  <SimulationControls
                    simStatus={simStatus}
                    elapsedMs={simElapsedMs}
                    onSimulate={(mode: SimMode, nRuns: RunCount) => runSimulation(mode, nRuns)}
                    onStop={stop}
                    onReset={reset}
                    disabled={loading}
                  />
                </div>

                {/* Results Chart */}
                <div className="overflow-y-auto p-4">
                  <ResultsChart results={results} simStatus={simStatus} />
                </div>
              </div>
            </>
          )}

          {/* ── Player Scout view ──────────────────────────────────────────── */}
          {leftView === 'scout' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900">
                <button
                  onClick={() => setLeftView('workspace')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  ← Back to Workspace
                </button>
                <span className="text-slate-700">|</span>
                <span className="text-xs font-semibold text-amber-400">🔎 Player Scout</span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <PlayerScoutPanel teams={auctionState?.teams ?? []} />
              </div>
            </div>
          )}

          {/* ── AI Research view ───────────────────────────────────────────── */}
          {leftView === 'rag' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900">
                <button
                  onClick={() => setLeftView('workspace')}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  ← Back to Workspace
                </button>
                <span className="text-slate-700">|</span>
                <span className="text-xs font-semibold text-violet-400">🤖 AI Research</span>
                {currentPlayer && (
                  <span className="text-xs text-slate-500">— context: {currentPlayer.name}</span>
                )}
              </div>
              <div className="flex-1 p-4 overflow-hidden flex flex-col">
                <RAGPanel
                  onQuery={askRag}
                  currentPlayerName={currentPlayer?.name}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANE: Squad panel (always visible) ───────────────────────── */}
        <div className="overflow-y-auto bg-slate-900/20 p-4">
          <SquadPanel
            squad={squad}
            teams={auctionState?.teams ?? []}
            selectedTeam={selectedTeam}
            onSelectTeam={setSelectedTeam}
            unsoldHistory={unsoldHistory}
          />
        </div>
      </main>
    </div>
  );
}
