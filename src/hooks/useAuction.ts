import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAuctionState, advancePlayer,
  getTeamSquad, getSimulationStatus, getLatestResults,
  simulateNextPlayer, simulateSet, simulateFullAuction,
  stopSimulation, resetAuction, ragQuery,
} from '../services/api';
import type {
  Player, TeamSquad, AuctionState, SimulationResult,
  SimulationStatus, SimMode, RunCount,
} from '../types';

export function useAuction() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string>('CSK');
  const [squad, setSquad] = useState<TeamSquad | null>(null);
  const [simStatus, setSimStatus] = useState<SimulationStatus>({
    running: false, progress: 0, current_run: 0, total_runs: 0, mode: '',
  });
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Initial load ──────────────────────────────────────────────────────────

  const loadState = useCallback(async () => {
    try {
      const state = await getAuctionState();
      setAuctionState(state);
      if (state.current_player) setCurrentPlayer(state.current_player);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { loadState(); }, [loadState]);

  // ── Squad polling ─────────────────────────────────────────────────────────

  const loadSquad = useCallback(async (team: string) => {
    try {
      const data = await getTeamSquad(team);
      setSquad(data);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    loadSquad(selectedTeam);
  }, [selectedTeam, loadSquad]);

  // ── Simulation polling ────────────────────────────────────────────────────

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status = await getSimulationStatus();
        setSimStatus(status);
        if (!status.running) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          const res = await getLatestResults();
          if (res.available) setResults(res as SimulationResult);
          // Refresh auction state after simulation
          await loadState();
        }
      } catch (_) {}
    }, 800);
  }, [loadState]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const nextPlayer = useCallback(async () => {
    setLoading(true);
    try {
      const p = await advancePlayer();
      setCurrentPlayer(p);
      await loadState();
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [loadState]);

  const runSimulation = useCallback(async (mode: SimMode, nRuns: RunCount) => {
    setLoading(true);
    setResults(null);
    try {
      if (mode === 'next_player') await simulateNextPlayer(nRuns);
      else if (mode === 'set') await simulateSet(nRuns);
      else await simulateFullAuction(nRuns);
      startPolling();
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [startPolling]);

  const stop = useCallback(async () => {
    await stopSimulation();
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setSimStatus(s => ({ ...s, running: false }));
  }, []);

  const reset = useCallback(async () => {
    await resetAuction();
    setResults(null);
    setSimStatus({ running: false, progress: 0, current_run: 0, total_runs: 0, mode: '' });
    await loadState();
  }, [loadState]);

  const askRag = useCallback(async (question: string) => {
    return ragQuery(question, currentPlayer?.name);
  }, [currentPlayer]);

  return {
    currentPlayer,
    auctionState,
    selectedTeam, setSelectedTeam,
    squad,
    simStatus,
    results,
    loading,
    error,
    nextPlayer,
    runSimulation,
    stop,
    reset,
    askRag,
    refreshSquad: () => loadSquad(selectedTeam),
  };
}
