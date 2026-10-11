// Match outcome encoding used by every `result` field below:
//   1 = win, 0 = loss, -1 = unknown (not decided upstream yet).
// Never render "not 1" as a loss -- use outcomeOf() from ./matchResult.

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
  /** how many players are on this ladder, for the percentile */
  ladder_size?: number | null;
  /** rank expressed as "top N%", computed from the rating distribution */
  top_percent?: number | null;
  /** how many players sit above this rating */
  players_above?: number | null;
  wins: number;
  losses: number;
  winrate: string;
}

export interface PreviousAlias {
  alias: string;
  first_seen_at: string | null;
  last_seen_at: string | null;
}

export interface PlayerProfile {
  profile_id: number;
  steamid: string | null;
  alias: string;
  /** other names this same account has been seen under */
  previous_aliases?: PreviousAlias[];
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
  /** null when no game has a decided outcome yet */
  win_rate: string | null;
}

export interface MapStat {
  map_name: string;
  map: string | null;
  games: number;
  wins: string;
  /** null when no game has a decided outcome yet */
  win_rate: string | null;
}

export interface LadderTotals {
  rating: number;
  highest_rating: number;
  rank: number;
  wins: number;
  losses: number;
  drops: number;
  disputes: number;
  streak: number;
  games: number;
  win_rate: number | null;
  last_match_at: string | null;
}

export interface PlayerStats {
  status: string;
  profile_id: number;
  // Totales globales: los de World's Edge (suma de ladders), null si no esta en ninguno.
  total_matches: number | null;
  total_wins: number | null;
  total_losses?: number | null;
  total_drops?: number | null;
  win_rate: number | null;
  ladders?: { rm_1v1: LadderTotals | null; rm_team: LadderTotals | null };
  // Partidas de nuestro historial en las que se basan civ_stats y map_stats.
  history_matches?: number;
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
  replay?: MatchReplayState;
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
  win_rate: number;
  score: number;
  thin: boolean;
}

export interface H2HMapStat {
  map_name: string;
  map: string | null;
  wins: number;
  losses: number;
  games: number;
  win_rate: number;
  score: number;
  thin: boolean;
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

export interface H2HSummary {
  first_meeting: string | null;
  last_meeting: string | null;
  streaks: {
    current: { type: 'win' | 'loss'; count: number } | null;
    longest_win: number;
    longest_loss: number;
  };
  elo: {
    /** net rating this rivalry has cost or given, over rated_games only */
    net: number | null;
    rated_games: number;
  };
  duration: {
    h2h_seconds: number | null;
    player_seconds: number | null;
    /** positive means these games run longer than the player's usual one */
    delta_seconds: number | null;
  };
  elo_expectation: {
    games: number;
    expected_wins: number;
    actual_wins: number;
    as_underdog: { wins: number; games: number };
    as_favourite: { wins: number; games: number };
  } | null;
  record: { decided: number; wins: number; losses: number };
  truncated: boolean;
}

export interface H2HMatchTypeRow {
  match_type_id: number;
  match_type: string;
  games: number;
  wins: number;
  losses: number;
}

export interface H2HVersusCiv {
  civ: number;
  civ_name: string;
  wins: number;
  losses: number;
  games: number;
  win_rate: number;
  score: number;
  /** too few games for the percentage to mean anything */
  thin: boolean;
}

export interface HeadToHeadData {
  status: string;
  player_id: number;
  opponent_id: number;
  total_games: number;
  /** meetings whose result never resolved; excluded from every rate */
  unresolved: number;
  wins: number;
  losses: number;
  win_rate: number;
  summary: H2HSummary;
  by_match_type: H2HMatchTypeRow[];
  versus_civ: H2HVersusCiv[];
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

export interface LadderStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stddev: number;
  total_players: number;
}

export interface LadderRangeStats {
  status: string;
  ladder: string;
  from: number | null;
  to: number | null;
  /** set when the band was asked for by place; equals the number of players */
  top?: number;
  players: number;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  stddev?: number;
  /** what slice of the whole ladder this range holds, in percent */
  share?: number;
  your_position?: number;
  /** how many others share the exact same rating */
  tied_with?: number;
}

export interface LadderDistribution {
  status: string;
  ladder: string;
  bucket_size: number;
  total_players: number;
  stats: LadderStats | null;
  max_rating: number | null;
  buckets: { rating: number; players: number }[];
  landmarks: {
    /** 25th and 75th percentile: where half the ladder sits */
    bulk_from: number | null;
    bulk_to: number | null;
    median: number | null;
    top_25: number | null;
    top_10: number | null;
    top_5: number | null;
    top_1: number | null;
    /** where the 16 best of the ladder start */
    elite_cutoff: number | null;
    top_100_cutoff: number | null;
  };
}

// Parte A: el percentil de un jugador a lo largo del tiempo. Un punto por
// instantanea del ladder, no por partida: el percentil se mueve aunque el
// jugador no juegue, porque el ladder se mueve debajo de el.
export interface PercentilePoint {
  date: string;
  rating: number;
  players_above: number;
  /** players_above + 1: el puesto que ocupa ese rating ese dia */
  position: number;
  /** cuantas cuentas con rating tenia el ladder ese dia */
  ladder_size: number;
  /** nunca 0: el mejor del mundo es el top 0,1%, no el top 0% */
  top_percent: number;
}

export interface PercentileSeries {
  points: PercentilePoint[];
  summary: {
    first: PercentilePoint;
    last: PercentilePoint;
    /** el percentil mas bajo, que no tiene que ser el rating mas alto */
    best: PercentilePoint;
    worst: PercentilePoint;
    /** negativo = subio en el ladder */
    percent_change: number;
    rating_change: number;
    improved: boolean;
  };
}

export interface PercentileHistoryResponse {
  status: string;
  profile_id: number;
  days: number;
  ladders: Record<string, PercentileSeries>;
}

// Parte B: la curva del ladder hoy contra la de hace N meses.
export interface DistributionSnapshot {
  date: string;
  total_players: number;
  mean: number;
  median: number;
  stddev: number;
  min: number;
  max: number;
  cutoffs: {
    top_50: number;
    top_25: number;
    top_10: number;
    top_5: number;
    top_1: number;
    top_100: number;
  };
  /** share va en porcentaje del ladder, que es lo comparable entre fechas */
  buckets: { rating: number; players: number; share: number }[];
}

export interface DistributionHistoryResponse {
  status: string;
  ladder: string;
  bucket_size: number;
  requested_months: number;
  span_days: number;
  earliest_date: string;
  before: DistributionSnapshot;
  after: DistributionSnapshot;
  shift: {
    mean: number;
    median: number;
    top_50: number;
    top_25: number;
    top_10: number;
    top_5: number;
    top_1: number;
    players: number;
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
  /** games with a decided outcome; win_rate is over this, not over `games` */
  decided: number;
  win_rate: number;
  last_played: string | null;
}

export interface OpponentAnalysisResponse {
  status: string;
  profile_id: number;
  total_opponents: number;
  /** which ladder the numbers cover; null label means "every match type" */
  filters: {
    match_type: string | null;
    label: string | null;
  };
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

// Match Detail
export interface MatchDetailPlayer {
  profile_id: number;
  alias: string | null;
  country: string | null;
  avatar: string | null;
  civilization_id: number;
  civilization: string | null;
  result: number;
  old_rating: number | null;
  new_rating: number | null;
  rating_diff: number | null;
  /** lo que salio del replay; null cuando no se alcanzo a rescatar */
  replay: MatchReplayMetrics | null;
}

export interface MatchReplayMetrics {
  opening: string | null;
  /** milisegundos de reloj de JUEGO hasta que se PIDE la subida de edad */
  feudal_ms: number | null;
  castle_ms: number | null;
  imperial_ms: number | null;
  villagers_15m: number | null;
  tc_idle_ms: number | null;
  apm: number | null;
  actions: number | null;
  units: {
    scouts: number | null; archers: number | null; skirmishers: number | null;
    knights: number | null; militia: number | null;
  };
  buildings: { ranges: number | null; stables: number | null };
}

export interface MatchDetailTeam {
  team_id: number;
  players: MatchDetailPlayer[];
  result: number;
}

export interface MatchDetail {
  match_id: number;
  map_name: string | null;
  map: string | null;
  match_type_id: number;
  match_type: string | null;
  duration_seconds: number | null;
  started_at: string | null;
  max_players: number;
  player_count: number;
  teams: MatchDetailTeam[];
}

export interface MatchDetailResponse {
  status: string;
  match: MatchDetail;
}

// Civ Meta
export interface CivMetaEntry {
  civ_id: number;
  games: number;
  wins: number;
  win_rate: number;
  avg_rating: number | null;
}

export interface CivMatchupEntry {
  civ1: number;
  civ2: number;
  games: number;
  civ1_wins: number;
  civ1_win_rate: number;
}

export interface CivMetaResponse {
  status: string;
  filters: { match_type: string; min_rating: number; max_rating: number; days: number };
  total_matches: number;
  civilizations: CivMetaEntry[];
}

export interface CivMatchupsResponse {
  status: string;
  filters: { match_type: string; min_rating: number; max_rating: number; days: number };
  matchups: CivMatchupEntry[];
}

export interface MapMetaEntry {
  map_name: string;
  games: number;
  avg_duration: number | null;
  unique_players: number;
}

export interface MapMetaResponse {
  status: string;
  filters: { match_type: string; days: number };
  maps: MapMetaEntry[];
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

// Account signals. El detector de juego familiar compartido lleva meses
// llenando la base; esto es lo que el front puede ensenar de ello.
// Nada por debajo de confianza 80 llega hasta aqui: el backend lo filtra.

/** Cada pata de la evidencia puede faltar, y eso se dice en vez de suponerse. */
export type EvidenceState = 'match' | 'differ' | 'unknown';

export interface SharedAccountEvidence {
  country: EvidenceState;
  state: EvidenceState;
  city: EvidenceState;
  /** dias entre la creacion de las dos cuentas de Steam, null si falta el dato */
  accounts_created_days_apart: number | null;
}

export interface SharedAccountDetection {
  detection_id: string | null;
  /** duenno de la copia del juego */
  lender_name: string | null;
  lender_profile_id: number | null;
  confidence: number;
  detection_method: 'passive_scan' | 'active_scan' | 'manual' | null;
  detected_at: string | null;
  last_seen: string | null;
  detection_count: number | null;
  game_name: string | null;
  evidence: SharedAccountEvidence;
}

/** Datos neutros de la cuenta de Steam. No son una acusacion de nada. */
export interface AccountFacts {
  steam_id: string | null;
  created_at: string | null;
  created_year: number | null;
  steam_level: number | null;
  game_count: number | null;
  friend_count: number | null;
  last_online: string | null;
  is_online: boolean;
  playing_now: string | null;
}

export interface PlayerSignalsResponse {
  status: string;
  profile_id: number;
  min_confidence: number;
  account: AccountFacts | null;
  aliases: {
    distinct_count: number;
    recorded_changes: number;
    list: PreviousAlias[];
  };
  shared_account: SharedAccountDetection[];
  has_signals: boolean;
}

export type SignalFlag = Omit<SharedAccountDetection, 'detection_id' | 'game_name'>;

export interface SignalFlagsResponse {
  status: string;
  min_confidence: number;
  requested: number;
  /** indexado por profile_id en texto */
  flags: Record<string, SignalFlag>;
}

export interface LevelBenchmark {
  bracket: string;
  samples: number;
  /** muestra demasiado corta para tomarla como referencia */
  thin: boolean;
  feudal_s: number | null;
  castle_s: number | null;
  villagers_15m: number | null;
  tc_idle_s: number | null;
  apm: number | null;
  /** negativo = puso el centro extra ANTES de pedir Castillos */
  first_extra_tc_s: number | null;
}

export interface LevelBenchmarksResponse {
  status: string;
  match_type: number;
  min_samples: number;
  total_samples: number;
  brackets: LevelBenchmark[];
}

/** Una cifra del diagnóstico: dónde estás tú contra los de tu mismo tramo. */
export interface AssessmentMetric {
  key: string;
  unit: string;
  lower_is_better: boolean;
  /** segundos de investigación que hay que sumar para el tiempo de aterrizaje */
  research_s?: number | null;
  you: number | null;
  bracket_median: number | null;
  /** % de jugadores de tu tramo a los que superas */
  percentile: number | null;
  /** cuánto decide esta cifra una partida, medido dentro de la misma partida */
  decides_pct: number;
  in_wins: number | null;
  in_losses: number | null;
}

export interface AssessmentVerdictItem {
  key: string;
  percentile: number;
  gap_to_median: number | null;
  priority: number;
}

export interface AssessmentResponse {
  status: string;
  profile_id: number;
  match_type: number;
  /** partidas del jugador rescatadas del replay */
  sample: number;
  ready: boolean;
  message?: string;
  /** true por debajo de min_reliable: se enseña igual, pero avisando */
  thin?: boolean;
  min_reliable?: number;
  rating?: number | null;
  bracket?: string;
  bracket_players?: number;
  wins_measured?: number;
  losses_measured?: number;
  /** sobre cuántos pares ganador-perdedor se midieron los pesos */
  weights_from_pairs?: number;
  metrics?: AssessmentMetric[];
  verdict?: AssessmentVerdictItem[];
  /**
   * No queda nada que apretar Y ademas va por delante de su tramo en lo que
   * separa niveles. Hay que decirlo con todas las letras: inventarle un
   * consejo a quien ya ejecuta bien es lo que hace el resto de herramientas.
   */
  nothing_to_tighten?: boolean;
  /** en cuantas cifras que separan niveles va por delante de su tramo */
  metrics_ahead_of_bracket?: number;
}

export interface BuildOrderComparison {
  age: 'feudal' | 'castle' | 'imperial';
  /** el "perfect landing time" que da la guía, en segundos */
  target_s: number;
  target_vils: number | null;
  /** cuándo te cae a ti */
  you_s: number;
  requested_s: number;
  delta_s: number;
}

export interface PlayerOpeningBuild {
  opening: string;
  games: number;
  wins: number;
  villagers_15m: number | null;
  build_order: { slug: string; name: string; source: string; civs: string[]; title_vils: number | null };
  comparison: BuildOrderComparison[];
  /** edades para las que la guía no da objetivo: el hueco es suyo, no nuestro */
  ages_not_specified: string[];
}

export interface PlayerBuildOrdersResponse {
  status: string;
  profile_id: number;
  match_type: number;
  /** el mapeo apertura -> build es nuestro, no de la guía */
  mapping_is_ours: boolean;
  openings: PlayerOpeningBuild[];
  openings_without_build: { opening: string; games: number }[];
}

export interface TimelineEvent {
  t: number;
  j: number;
  tipo: 'build' | 'wall' | 'tech' | 'queue' | 'resign' | 'delete'
    /** pulso "volver al trabajo": antes habia metido aldeanos a cubierto */
    | 'a_trabajar'
    /** movio el punto de reunion, y lo movio lejos */
    | 'reunion';
  id?: number;
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  n?: number;
}

export interface TimelineArmyOrder {
  t: number;
  j: number;
  x: number;
  y: number;
  n: number;
  obj?: number | null;
}

export interface TimelinePlayer {
  numero: number;
  /** null cuando es una IA: un bot no tiene perfil */
  perfil: number | null;
  nombre: string;
  civ: number | null;
  color?: number;
  /** true si es un bot; su nombre sale del campo de IA del replay */
  es_ia?: boolean;
  /** el rating con el que jugó, sacado del bloque final del propio replay */
  rating?: number;
  rank?: number;
  nombre_ia?: string;
}

export interface ReplayTimeline {
  version: string;
  duracion_ms: number;
  jugadores: TimelinePlayer[];
  eventos: TimelineEvent[];
  ejercito: TimelineArmyOrder[];
  limites: { x_max: number; y_max: number };
  /** lado del mapa en casillas, para dibujarlo entero y no solo donde hubo acción */
  lado_mapa?: number;
  /** terreno y elevación por casilla, en tiras (valor, cuántas) */
  suelo?: {
    lado: number;
    terreno: [number, number][];
    elevacion: [number, number][];
  } | null;
  /** lo comprado y vendido en el mercado, por jugador y recurso */
  mercado?: Record<string, Record<string, { compra: number; venta: number }>>;
  /** acciones por minuto: [minuto, mando, gestión, efectivas] por jugador */
  ritmo?: Record<string, [number, number, number, number][]>;
  /**
   * Dónde miraba la cámara, una muestra cada dos segundos: [ms, x, y].
   * Es la del jugador que GUARDÓ la rec, no la de los dos.
   */
  vista?: [number, number, number][];
  /** de qué jugador es esa cámara; null si no se puede afirmar */
  vista_de?: number | null;
  /** la conversación, sin los avisos automáticos del juego */
  chat?: {
    t: number;
    j: number | null;
    texto: string;
    /** número del taunt, o null si lo escribió a mano */
    taunt: number | null;
    /** el fichero lo soltó en su volcado inicial: la hora no es fiable */
    sin_hora: boolean;
  }[];
  /** cuántas veces cambió cada uno la postura de sus unidades */
  posturas?: Record<string, number>;
  /** oro, piedra, rebaño, caza, pesca y fauna del mapa (sin árboles) */
  recursos?: {
    t: 'oro' | 'piedra' | 'rebano' | 'caza' | 'pesca' | 'fauna';
    id: number;
    x: number;
    y: number;
    /** cuándo se fue a por ello por primera vez */
    usado_ms?: number;
    /** cuándo dejó de dar recurso: los aldeanos que lo trabajaban se fueron */
    agotado_ms?: number;
    /** a dónde se le mandó andar, para el rebaño */
    pasos?: [number, number, number][];
  }[] | null;
}

/** la cabecera del replay: velocidad, jugadores y de qué mapa se trata */
export interface TimelineInfo {
  velocidad?: number;
  jugadores?: TimelinePlayer[];
  /** el del ladder si la partida es de ahí, si no el del generador */
  mapa?: string | null;
  /** 'tiny', 'small'... o el lado en casillas si no es uno de los fijos */
  mapa_tamano?: string | number | null;
}

export interface MatchTimelineResponse {
  status: string;
  match_id: number;
  info: TimelineInfo | null;
  players: Record<string, unknown>[];
  timeline: ReplayTimeline | null;
  timeline_error?: string | null;
}

export interface ReplayUploadResult {
  file: string;
  ok: boolean;
  error?: string;
  bytes?: number;
  match_id: number | null;
  matched: boolean;
  already_analyzed: boolean;
  stored: boolean;
  info: TimelineInfo | null;
  players: Record<string, unknown>[];
  timeline: ReplayTimeline | null;
  timeline_error?: string | null;
}

export interface ReplayUploadResponse {
  status: string;
  analyzed: number;
  results: ReplayUploadResult[];
}

/** Qué se sabe del replay de una partida, para marcarla en la lista. */
export interface MatchReplayState {
  analyzed: boolean;
  players_measured: number;
  /** la apertura del jugador cuyo perfil se mira */
  opening: string | null;
  feudal_ms: number | null;
  castle_ms: number | null;
  queue_status: string | null;
  /** Relic ya no lo tiene: no hay nada que esperar */
  unavailable: boolean;
}
