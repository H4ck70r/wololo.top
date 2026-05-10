export interface PlayerSearchResult {
  profile_id: number;
  steamid: string | null;
  alias: string;
  rating: number;
  rank: number;
  lastmatchdate: number | null;
  ladder_type: string;
  country?: string | null;
}

export interface PlayerSearchResponse {
  status: string;
  search_type: string;
  query: string;
  total: number;
  players: PlayerSearchResult[];
}

export interface LadderEntry {
  type: string;
  rating: number;
  rank: number;
  wins: number;
  losses: number;
  winrate: string;
}

export interface PlayerProfile {
  profile_id: number;
  steamid: string | null;
  alias: string;
  country: string | null;
  avatar: string | null;
  wins: number;
  losses: number;
  streak: number;
  winrate: string;
  lastmatchdate: number | null;
  ladders: LadderEntry[];
}

export interface PlayerProfileResponse {
  status: string;
  player: PlayerProfile;
}

export interface CivStat {
  civ_id: number;
  civilization: string | null;
  games: number;
  wins: string;
  win_rate: string;
}

export interface MapStat {
  map_name: string;
  map: string | null;
  games: number;
  wins: string;
  win_rate: string;
}

export interface PlayerStats {
  status: string;
  profile_id: number;
  total_matches: number;
  total_wins: number;
  win_rate: number;
  civ_stats: CivStat[];
  map_stats: MapStat[];
  last_match_at: string | null;
  last_computed_at: string;
}

export interface MatchPlayer {
  profile_id: number;
  alias: string | null;
  civilization_id: number;
  civilization: string | null;
  result: number;
  team_id: number;
  old_rating: number | null;
  new_rating: number | null;
  rating_diff: number | null;
}

export interface MatchTeam {
  team_id: number;
  players: MatchPlayer[];
}

export interface MatchRecord {
  match_id: number;
  map_name: string | null;
  map: string | null;
  match_type_id: number;
  match_type: string | null;
  duration_seconds: number | null;
  started_at: string | null;
  max_players: number;
  player_count: number;
  civilization_id: number;
  civilization: string | null;
  result: number;
  old_rating: number | null;
  new_rating: number | null;
  team_id: number;
  teams: MatchTeam[];
}

export interface MatchesResponse {
  status: string;
  profile_id: number;
  total: number;
  limit: number;
  offset: number;
  matches: MatchRecord[];
}

export interface H2HCivMatchup {
  player_civ: number;
  player_civ_name: string | null;
  opponent_civ: number;
  opponent_civ_name: string | null;
  wins: number;
  losses: number;
  games: number;
}

export interface H2HMapStat {
  map_name: string;
  map: string | null;
  wins: number;
  losses: number;
  games: number;
}

export interface H2HMatch {
  match_id: number;
  player_civ: number;
  player_civ_name: string | null;
  player_result: number;
  player_old_rating: number | null;
  player_new_rating: number | null;
  opponent_civ: number;
  opponent_civ_name: string | null;
  opponent_result: number;
  opponent_old_rating: number | null;
  opponent_new_rating: number | null;
  map_name: string | null;
  map: string | null;
  match_type_id: number;
  match_type: string | null;
  duration_seconds: number | null;
  started_at: string | null;
  max_players: number;
}

export interface HeadToHeadData {
  status: string;
  player_id: number;
  opponent_id: number;
  total_games: number;
  wins: number;
  losses: number;
  win_rate: number;
  civ_matchups: H2HCivMatchup[];
  map_stats: H2HMapStat[];
  recent_matches: H2HMatch[];
}

export interface LeaderboardPlayer {
  profile_id: number;
  name: string;
  country: string | null;
  alias: string;
  rank: number;
  rating: number;
  highestrating: number;
  wins: number;
  losses: number;
  streak: number;
  avatar: string | null;
  winrate: string;
  last_updated: string;
}

export interface LeaderboardResponse {
  status: string;
  data: {
    players: LeaderboardPlayer[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface RatingSnapshot {
  date: string;
  rating: number;
  rank: number;
  wins: number;
  losses: number;
}

export interface RatingHistoryResponse {
  status: string;
  profile_id: number;
  days: number;
  ladders: Record<string, RatingSnapshot[]>;
}

// WLT-2: Opponent Analysis
export interface OpponentEntry {
  profile_id: number;
  alias: string | null;
  avatar: string | null;
  games: number;
  wins: number;
  losses: number;
  win_rate: number;
  last_played: string | null;
}

export interface OpponentAnalysisResponse {
  status: string;
  profile_id: number;
  total_opponents: number;
  highlights: {
    most_played: OpponentEntry | null;
    nemesis: OpponentEntry | null;
    best_matchup: OpponentEntry | null;
  };
  opponents: OpponentEntry[];
}

// WLT-3: Rating Trends
export interface LadderTrend {
  current_rating: number | null;
  delta_7d: number | null;
  delta_30d: number | null;
  peak_rating: number | null;
  peak_date: string | null;
  lowest_rating: number | null;
  games_7d: number | null;
}

export interface RatingTrendsResponse {
  status: string;
  profile_id: number;
  ladders: Record<string, LadderTrend>;
  streaks: {
    current_streak: number;
    best_win_streak: number;
    worst_loss_streak: number;
  };
}

// WLT-4: Milestones
export interface Milestone {
  threshold: number;
  reached_at: string;
  ladder_type: string;
}

export interface MilestoneLadder {
  peak_rating: number | null;
  peak_date: string | null;
  highest_rating: number | null;
  milestones: Milestone[];
}

export interface MilestonesResponse {
  status: string;
  profile_id: number;
  ladders: {
    rm?: MilestoneLadder;
    team_rm?: MilestoneLadder;
  };
}

// WLT-6: Activity Patterns
export interface HeatmapCell {
  dow: number;
  hour: number;
  games: number;
  wins: number;
}

export interface ActivityPatternsResponse {
  status: string;
  profile_id: number;
  heatmap: HeatmapCell[];
  peak_hour: number | null;
  peak_day: number | null;
  total_tracked: number;
  most_active_period: string | null;
}

// WLT-1: Live Matches
export interface LiveMatchPlayer {
  profile_id: number;
  alias: string | null;
  rating: number | null;
  rank: number | null;
}

export interface LiveMatch {
  lobby_id: number;
  status: string;
  map_name: string | null;
  map: string | null;
  match_type_id: number | null;
  match_type: string | null;
  description: string | null;
  server: string | null;
  player_count: number;
  duration_seconds: number | null;
  started_at: string | null;
  detected_at: string | null;
  last_seen_at: string | null;
  players: LiveMatchPlayer[];
}

export interface LiveMatchesResponse {
  status: string;
  total: number;
  matches: LiveMatch[];
}

// WLT-5: Enhanced Leaderboard
export interface EnhancedLeaderboardPlayer {
  profile_id: number;
  name: string;
  country: string | null;
  alias: string;
  clanlist_name: string | null;
  rank: number;
  rating: number;
  highestrating: number;
  wins: number;
  losses: number;
  streak: number;
  avatar: string | null;
  lastmatchdate: number | null;
  winrate: string;
  last_updated?: string;
}

export interface EnhancedLeaderboardResponse {
  status: string;
  data: {
    players: EnhancedLeaderboardPlayer[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
    filters: {
      type: string;
      country: string | null;
      clan: string | null;
      min_rating: number | null;
      max_rating: number | null;
      search: string | null;
    };
    meta: {
      last_updated: string | null;
      available_countries: { country: string; player_count: number }[];
    };
  };
}

export interface CountryStatsEntry {
  country: string;
  player_count: number;
  avg_rating: number;
  top_rating: number;
}

export interface CountryStatsResponse {
  status: string;
  data: {
    type: string;
    countries: CountryStatsEntry[];
    total_countries: number;
  };
}

// Match Enrichment
export interface EnrichmentStatusResponse {
  status: string;
  profile_id: number;
  match_count: number;
  oldest_match: string | null;
  newest_match: string | null;
  last_enriched_at: string | null;
  can_enrich: boolean;
  needs_enrichment: boolean;
}
