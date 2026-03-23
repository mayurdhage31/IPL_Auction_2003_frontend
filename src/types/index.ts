export interface PlayerOutcome {
  status: 'sold' | 'unsold';
  team_code?: string;
  price_cr?: number;
}

export interface Player {
  name: string;
  role: string;
  origin: string;
  base_price: number;
  base_price_cr: number;
  set_type: string;
  batting_category?: string | null;
  bowling_category?: string | null;
  avg_price_cr?: number | null;
  historical_prices?: PriceRecord[];
  index_in_pool: number;
  total_in_pool: number;
  /** Present when this player has been explicitly sold or marked unsold in the live auction. */
  outcome?: PlayerOutcome | null;
}

export interface SellPlayerRequest {
  team_code: string;
  price_cr: number;
}

export interface PriceRecord {
  year: number;
  team: string;
  team_code: string;
  amount: number;
  amount_cr: number;
}

export interface SquadPlayer {
  name: string;
  role: string;
  origin: string;
  price_paid_cr?: number | null;
}

export interface SquadCounters {
  batsmen: number;
  bowlers: number;
  allrounders: number;
  wicketkeepers: number;
  indians: number;
  overseas: number;
  overseas_max: number;
}

export interface TeamSquad {
  team_code: string;
  team_name: string;
  remaining_purse_cr: number;
  total_purse_cr: number;
  squad: SquadPlayer[];
  counters: SquadCounters;
}

export interface TeamInfo {
  code: string;
  name: string;
  remaining_purse_cr: number;
}

export interface PriceDistribution {
  player_name: string;
  role: string;
  origin: string;
  n_runs: number;
  sold_count: number;
  unsold_count: number;
  unsold_probability: number;
  min_cr: number;
  p10_cr: number;
  p25_cr: number;
  median_cr: number;
  p75_cr: number;
  p90_cr: number;
  max_cr: number;
  mean_cr: number;
  team_win_probabilities: Record<string, number>;
}

export interface SimulationResult {
  available: boolean;
  mode: string;
  n_runs: number;
  distributions: PriceDistribution[];
  duration_ms: number;
}

export interface SimulationStatus {
  running: boolean;
  progress: number;
  current_run: number;
  total_runs: number;
  mode: string;
}

export interface SetTotals {
  marquee: number;
  capped: number;
  uncapped: number;
}

export interface UnsoldEntry {
  name: string;
  role: string;
  set_type: string;
  base_price_cr: number;
}

export interface AuctionState {
  current_player: Player | null;
  current_set: string;
  current_index: number;
  players_remaining: number;
  teams: TeamInfo[];
  simulation_running: boolean;
  set_totals?: SetTotals;
}

export type SimMode = 'next_player' | 'set' | 'full_auction';
export type RunCount = 100 | 500 | 1000;

export interface PlayerSummary {
  name: string;
  role: string;
  origin: string;
  set_type: string;
  avg_price_cr: number;
}

export interface PlayerDetail extends Player {
  max_price_cr: number | null;
  latest_price_cr: number | null;
  latest_year: number | null;
  peak_year: number | null;
  trajectory: string | null;
  price_trend: number;
  volatility: number;
  auction_appearances: number;
  total_teams: number;
  batting_avg: number | null;
  batting_sr: number | null;
  total_runs: number | null;
  wickets: number | null;
  economy: number | null;
  bowling_sr: number | null;
}
