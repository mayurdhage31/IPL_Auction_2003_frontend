import { useState, useEffect } from 'react';
import { useAuction } from '../hooks/useAuction';
import NominationPanel from '../components/NominationPanel';
import SimulationControls from '../components/SimulationControls';
import ResultsChart from '../components/ResultsChart';
import SquadPanel from '../components/SquadPanel';
import RAGPanel from '../components/RAGPanel';
import PlayerScoutPanel from '../components/PlayerScoutPanel';
import type { SimMode, RunCount } from '../types';

type LeftTab = 'console' | 'results' | 'rag' | 'scout';

export default function AuctionPage() {
  const {
    currentPlayer,
    auctionState,
    selectedTeam, setSelectedTeam,
    squad,
    simStatus,
    simulationJustCompleted,
    results,
    loading,
    error,
    nextPlayer,
    runSimulation,
    stop,
    reset,
    askRag,
  } = useAuction();

  const [leftTab, setLeftTab] = useState<LeftTab>('console');

  // Auto-switch to Results tab when a simulation finishes
  useEffect(() => {
    if (simulationJustCompleted) {
      setLeftTab('results');
    }
  }, [simulationJustCompleted]);

  const selectedTeamPurse = auctionState?.teams.find(t => t.code === selectedTeam)?.remaining_purse_cr ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl">🏏</span>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-white">IPL Auction Simulator</h1>
            <p className="text-[10px] text-slate-500">Monte Carlo · 10 AI Franchise Agents · Gemini RAG</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Purse badge for selected team */}
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
            <span className="text-xs text-slate-500">{selectedTeam} Purse</span>
            <span className="text-sm font-bold text-emerald-400">₹{selectedTeamPurse.toFixed(1)}Cr</span>
          </div>

          {/* Player count */}
          {currentPlayer && (
            <div className="text-xs text-slate-500">
              Player {currentPlayer.index_in_pool + 1} of {currentPlayer.total_in_pool}
            </div>
          )}

          {error && (
            <div className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">
              {error}
            </div>
          )}
        </div>
      </header>

      {/* ── Main split layout ───────────────────────────────────────────────── */}
      <main className="flex-1 grid grid-cols-[1fr_340px] gap-0 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

        {/* ── LEFT PANE ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col border-r border-slate-800 overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-slate-800 bg-slate-900">
            {([
              { id: 'console', label: 'Live Console', icon: '📺' },
              { id: 'results', label: 'Results', icon: '📊' },
              { id: 'scout', label: 'Player Scout', icon: '🔎' },
              { id: 'rag', label: 'AI Research', icon: '🤖' },
            ] as { id: LeftTab; label: string; icon: string }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setLeftTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  leftTab === tab.id
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Left content area — split into top half and bottom half */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {leftTab === 'console' && (
              <div className="flex flex-1 overflow-hidden min-h-0">
                {/* Nomination */}
                <div className="flex-1 p-4 overflow-y-auto border-r border-slate-800">
                  <NominationPanel
                    player={currentPlayer}
                    onNext={nextPlayer}
                    loading={loading}
                  />
                </div>
                {/* Simulation controls */}
                <div className="w-64 p-4 overflow-y-auto">
                  <SimulationControls
                    simStatus={simStatus}
                    onSimulate={(mode: SimMode, nRuns: RunCount) => runSimulation(mode, nRuns)}
                    onStop={stop}
                    onReset={reset}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {leftTab === 'results' && (
              <div className="flex-1 p-5 overflow-y-auto">
                <ResultsChart results={results} simStatus={simStatus} />
              </div>
            )}

            {leftTab === 'scout' && (
              <div className="flex-1 p-4 overflow-y-auto">
                <PlayerScoutPanel teams={auctionState?.teams ?? []} />
              </div>
            )}

            {leftTab === 'rag' && (
              <div className="flex-1 p-4 overflow-hidden flex flex-col">
                <RAGPanel
                  onQuery={askRag}
                  currentPlayerName={currentPlayer?.name}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANE: Squad panel ────────────────────────────────────────── */}
        <div className="p-4 overflow-y-auto bg-slate-900/20">
          <SquadPanel
            squad={squad}
            teams={auctionState?.teams ?? []}
            selectedTeam={selectedTeam}
            onSelectTeam={setSelectedTeam}
          />
        </div>
      </main>
    </div>
  );
}
