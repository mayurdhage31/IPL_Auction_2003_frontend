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

export interface AuctionState {
  current_player: Player | null;
  current_set: string;
  current_index: number;
  players_remaining: number;
  teams: TeamInfo[];
  simulation_running: boolean;
}

export type SimMode = 'next_player' | 'set' | 'full_auction';
export type RunCount = 100 | 500 | 1000;
