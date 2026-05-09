export interface PlayerSearchResult {
  profile_id: number;
  steamid: string | null;
  alias: string;
  rating: number;
  rank: number;
  lastmatchdate: number | null;
  ladder_type: string;
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
  games: number;
  wins: string;
  win_rate: string;
}

export interface MapStat {
  map_name: string;
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

export interface MatchRecord {
  match_id: number;
  civilization_id: number;
  map_name: string | null;
  result: number;
  team_id: number;
  match_type_id: number;
  old_rating: number | null;
  new_rating: number | null;
  duration_seconds: number | null;
  started_at: string | null;
  max_players: number;
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
  opponent_civ: number;
  wins: number;
  losses: number;
  games: number;
}

export interface H2HMapStat {
  map_name: string;
  wins: number;
  losses: number;
  games: number;
}

export interface H2HMatch {
  match_id: number;
  player_civ: number;
  player_result: number;
  player_old_rating: number | null;
  player_new_rating: number | null;
  opponent_civ: number;
  opponent_result: number;
  opponent_old_rating: number | null;
  opponent_new_rating: number | null;
  map_name: string | null;
  match_type_id: number;
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
