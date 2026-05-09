export interface PlayerSearchResult {
  profile_id: number;
  name: string;
  country?: string;
  avatar?: string;
  last_match_time?: number;
  rm_rating?: number;
  rm_rank?: number;
  team_rm_rating?: number;
  team_rm_rank?: number;
}

export interface PlayerProfile {
  profile_id: number;
  name: string;
  country?: string;
  avatar?: string;
  steam_id?: string;
  rm_rating?: number;
  rm_rank?: number;
  rm_wins?: number;
  rm_losses?: number;
  rm_streak?: number;
  rm_highest_rating?: number;
  team_rm_rating?: number;
  team_rm_rank?: number;
  team_rm_wins?: number;
  team_rm_losses?: number;
  team_rm_streak?: number;
  team_rm_highest_rating?: number;
}

export interface CivStat {
  civ_id: number;
  civ_name?: string;
  games: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface MapStat {
  map_name: string;
  games: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface PlayerStats {
  civ_stats: CivStat[];
  map_stats: MapStat[];
}

export interface Match {
  match_id: string;
  started?: number;
  finished?: number;
  map_name?: string;
  duration?: number;
  ranked?: boolean;
  leaderboard_id?: number;
  rating?: number;
  rating_change?: number;
  civ_id?: number;
  civ_name?: string;
  won?: boolean;
  opponent_name?: string;
  opponent_profile_id?: number;
  opponent_civ_id?: number;
  opponent_civ_name?: string;
  opponent_rating?: number;
  num_players?: number;
  team_size?: number;
}

export interface HeadToHeadData {
  player: PlayerProfile;
  opponent: PlayerProfile;
  total_games: number;
  player_wins: number;
  opponent_wins: number;
  civ_matchups: CivMatchup[];
  map_stats: MapH2HStat[];
  recent_matches: Match[];
}

export interface CivMatchup {
  player_civ_id: number;
  player_civ_name?: string;
  opponent_civ_id: number;
  opponent_civ_name?: string;
  games: number;
  player_wins: number;
  opponent_wins: number;
}

export interface MapH2HStat {
  map_name: string;
  games: number;
  player_wins: number;
  opponent_wins: number;
}

export interface LeaderboardEntry {
  rank: number;
  profile_id: number;
  name: string;
  country?: string;
  rating: number;
  wins: number;
  losses: number;
  win_rate: number;
  streak?: number;
  highest_rating?: number;
}

export interface LeaderboardResponse {
  leaderboard_id: number;
  total: number;
  start: number;
  count: number;
  entries: LeaderboardEntry[];
}
