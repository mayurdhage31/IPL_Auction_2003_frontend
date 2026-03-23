import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getAuctionState, advancePlayer,
  getTeamSquad, getSimulationStatus, getLatestResults,
  simulateNextPlayer, simulateSet, simulateFullAuction,
  stopSimulation, resetAuction, ragQuery,
  sellPlayer as apiSellPlayer, markPlayerUnsold as apiMarkUnsold,
} from '../services/api';
import type {
  Player, TeamSquad, AuctionState, SimulationResult,
  SimulationStatus, SimMode, RunCount, UnsoldEntry,
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
  const [unsoldHistory, setUnsoldHistory] = useState<UnsoldEntry[]>([]);
  const [simElapsedMs, setSimElapsedMs] = useState<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simStartTimeRef = useRef<number | null>(null);

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
        // Update elapsed time
        if (simStartTimeRef.current) {
          setSimElapsedMs(Date.now() - simStartTimeRef.current);
        }
        setSimStatus(status);
        if (!status.running) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          simStartTimeRef.current = null;
          const res = await getLatestResults();
          if (res.available) {
            setResults(res as SimulationResult);
          }
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
      // Immediately mark as running so buttons stay disabled before first poll fires
      simStartTimeRef.current = Date.now();
      setSimElapsedMs(0);
      setSimStatus(s => ({ ...s, running: true, mode, total_runs: nRuns, current_run: 0, progress: 0 }));
      startPolling();
    } catch (e: any) {
      const detail = (e as any)?.response?.data?.detail;
      setError(detail ? `Simulation error: ${detail}` : e.message);
    } finally { setLoading(false); }
  }, [startPolling]);

  const stop = useCallback(async () => {
    await stopSimulation();
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    simStartTimeRef.current = null;
    setSimStatus(s => ({ ...s, running: false }));
  }, []);

  const reset = useCallback(async () => {
    await resetAuction();
    setResults(null);
    setSimStatus({ running: false, progress: 0, current_run: 0, total_runs: 0, mode: '' });
    setUnsoldHistory([]);
    setSimElapsedMs(0);
    simStartTimeRef.current = null;
    await loadState();
    // Refresh squad panel so it reflects the cleared state (empty squad, full purse)
    await loadSquad(selectedTeam);
  }, [loadState, loadSquad, selectedTeam]);

  const askRag = useCallback(async (question: string) => {
    return ragQuery(question, currentPlayer?.name);
  }, [currentPlayer]);

  /**
   * Live auction action: sell the current player to a franchise.
   * Updates team purse, squad, and role/overseas counters.
   * Completely separate from Monte Carlo simulation — this is a permanent decision.
   *
   * After the sale:
   * - The right-side panel switches to the buying team so the update is immediately visible.
   * - The nomination panel shows the confirmed outcome badge.
   */
  const sellPlayer = useCallback(async (teamCode: string, priceCr: number) => {
    setLoading(true);
    try {
      await apiSellPlayer(teamCode, priceCr);
      // Switch the right-side panel to the buying team so the updated squad is immediately visible
      setSelectedTeam(teamCode.toUpperCase());
      // loadState re-fetches current player (with outcome) + teams list (updated purses)
      await loadState();
      // loadSquad is called by the selectedTeam useEffect above, but force it now for immediacy
      await loadSquad(teamCode.toUpperCase());
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(detail ?? e.message);
    } finally {
      setLoading(false);
    }
  }, [loadState, loadSquad, setSelectedTeam]);

  /**
   * Live auction action: mark the current player as unsold.
   * No purse or squad state is changed.
   */
  const markUnsold = useCallback(async () => {
    const player = currentPlayer;
    setLoading(true);
    try {
      await apiMarkUnsold();
      if (player) {
        setUnsoldHistory(prev => [...prev, {
          name: player.name,
          role: player.role,
          set_type: player.set_type,
          base_price_cr: player.base_price_cr,
        }]);
      }
      await loadState();
    } catch (e: any) {
      const detail = e?.response?.data?.detail;
      setError(detail ?? e.message);
    } finally {
      setLoading(false);
    }
  }, [loadState, currentPlayer]);

  return {
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
    refreshSquad: () => loadSquad(selectedTeam),
  };
}
