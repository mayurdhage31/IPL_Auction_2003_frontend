import axios from 'axios';
import type {
  Player, TeamSquad, TeamInfo, AuctionState,
  SimulationResult, SimulationStatus, PlayerDetail, PlayerSummary,
} from '../types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

const api = axios.create({ baseURL: BASE });

// ── Teams ──────────────────────────────────────────────────────────────────

export const getTeams = (): Promise<TeamInfo[]> =>
  api.get('/teams').then(r => r.data);

export const getTeamSquad = (code: string): Promise<TeamSquad> =>
  api.get(`/teams/${code}/squad`).then(r => r.data);

// ── Players ────────────────────────────────────────────────────────────────

export const getCurrentPlayer = (): Promise<Player> =>
  api.get('/players/current').then(r => r.data);

export const advancePlayer = (): Promise<Player> =>
  api.post('/players/next').then(r => r.data);

export const getPlayerDetail = (name: string): Promise<PlayerDetail> =>
  api.get(`/players/${encodeURIComponent(name)}`).then(r => r.data);

export const getPlayersForTeam = (teamCode: string): Promise<PlayerSummary[]> =>
  api.get('/players', { params: { team: teamCode } }).then(r => r.data);

// ── Auction state ──────────────────────────────────────────────────────────

export const getAuctionState = (): Promise<AuctionState> =>
  api.get('/auction/state').then(r => r.data);

export const resetAuction = (): Promise<void> =>
  api.post('/auction/reset').then(r => r.data);

/** Sell the current player to a franchise at a confirmed hammer price. */
export const sellPlayer = (team_code: string, price_cr: number) =>
  api.post('/auction/sell', { team_code, price_cr }).then(r => r.data);

/** Mark the current player as unsold (no squad/purse change). */
export const markPlayerUnsold = () =>
  api.post('/auction/unsold').then(r => r.data);

// ── Simulation ─────────────────────────────────────────────────────────────

export const simulateNextPlayer = (n_runs: number) =>
  api.post('/simulate/next-player', { n_runs }).then(r => r.data);

export const simulateSet = (n_runs: number) =>
  api.post('/simulate/set', { n_runs }).then(r => r.data);

export const simulateFullAuction = (n_runs: number) =>
  api.post('/simulate/auction', { n_runs }).then(r => r.data);

export const stopSimulation = () =>
  api.post('/simulation/stop').then(r => r.data);

export const getSimulationStatus = (): Promise<SimulationStatus> =>
  api.get('/simulation/status').then(r => r.data);

export const getLatestResults = (): Promise<SimulationResult> =>
  api.get('/results/latest').then(r => r.data);

// ── RAG ────────────────────────────────────────────────────────────────────

export const ragQuery = (question: string, player_name?: string) =>
  api.post('/rag/query', { question, player_name }).then(r => r.data);

// ── Health ─────────────────────────────────────────────────────────────────

export const getHealth = () =>
  api.get('/health').then(r => r.data);
