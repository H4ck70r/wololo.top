const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_KEY = import.meta.env.VITE_API_KEY || '';

async function apiFetch<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const fullUrl = BASE_URL ? `${BASE_URL}${path}` : path;
  const url = new URL(fullUrl, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const res = await fetch(url.toString(), {
    headers: {
      'X-API-Key': API_KEY,
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

import type {
  PlayerSearchResponse,
  PlayerProfileResponse,
  PlayerStats,
  MatchesResponse,
  HeadToHeadData,
  LeaderboardResponse,
  RatingHistoryResponse,
  OpponentAnalysisResponse,
  RatingTrendsResponse,
  MilestonesResponse,
  ActivityPatternsResponse,
  LiveMatchesResponse,
  EnhancedLeaderboardResponse,
  CountryStatsResponse,
  EnrichmentStatusResponse,
  CivMetaResponse,
  CivMatchupsResponse,
  LevelBenchmarksResponse,
  MapMetaResponse,
  MatchDetailResponse,
  LadderDistribution,
  LadderRangeStats,
  PlayerSignalsResponse,
  SignalFlagsResponse,
  PercentileHistoryResponse,
  DistributionHistoryResponse,
  AssessmentResponse,
  PlayerBuildOrdersResponse,
  MatchTimelineResponse,
  ReplayUploadResponse,
} from './types';

export async function searchPlayers(query: string): Promise<PlayerSearchResponse> {
  return apiFetch<PlayerSearchResponse>('/api/players/search', { q: query });
}

export async function getPlayer(profileId: number | string): Promise<PlayerProfileResponse> {
  return apiFetch<PlayerProfileResponse>(`/api/players/${profileId}`);
}

export async function getPlayerStats(profileId: number | string): Promise<PlayerStats> {
  return apiFetch<PlayerStats>(`/api/players/${profileId}/stats`);
}

export async function getPlayerMatches(
  profileId: number | string,
  params?: { limit?: number; offset?: number; match_type?: string }
): Promise<MatchesResponse> {
  return apiFetch<MatchesResponse>(`/api/players/${profileId}/matches`, params as Record<string, string | number>);
}

export async function getHeadToHead(
  profileId: number | string,
  opponentId: number | string
): Promise<HeadToHeadData> {
  return apiFetch<HeadToHeadData>(`/api/players/${profileId}/head-to-head/${opponentId}`);
}

export async function getRatingHistory(
  profileId: number | string,
  params?: { days?: number; ladder?: string }
): Promise<RatingHistoryResponse> {
  return apiFetch<RatingHistoryResponse>(`/api/players/${profileId}/rating-history`, params as Record<string, string | number>);
}

export async function getPercentileHistory(
  profileId: number | string,
  params?: { days?: number; ladder?: string }
): Promise<PercentileHistoryResponse> {
  return apiFetch<PercentileHistoryResponse>(
    `/api/players/${profileId}/percentile-history`,
    params as Record<string, string | number>
  );
}

export async function getLadderDistributionHistory(params?: {
  type?: 'solo' | 'team';
  months?: number;
  bucket?: number;
}): Promise<DistributionHistoryResponse> {
  return apiFetch<DistributionHistoryResponse>(
    '/api/ladder/distribution-history',
    params as Record<string, string | number>
  );
}

export async function getLadderDistribution(
  type: 'solo' | 'team' = 'solo',
  bucket = 50
): Promise<LadderDistribution> {
  return apiFetch<LadderDistribution>('/api/ladder/distribution', { type, bucket });
}

export async function getLeaderboard(
  type: 'rm' | 'team-rm' = 'rm',
  params?: { limit?: number; page?: number }
): Promise<LeaderboardResponse> {
  return apiFetch<LeaderboardResponse>(`/api/ladder/${type}`, params as Record<string, string | number>);
}

export async function getOpponentAnalysis(
  profileId: number | string,
  params?: { limit?: number; match_type?: string }
): Promise<OpponentAnalysisResponse> {
  return apiFetch<OpponentAnalysisResponse>(`/api/players/${profileId}/opponents`, params as Record<string, string | number>);
}

export async function getRatingTrends(profileId: number | string): Promise<RatingTrendsResponse> {
  return apiFetch<RatingTrendsResponse>(`/api/players/${profileId}/rating-trends`);
}

export async function getPlayerMilestones(profileId: number | string): Promise<MilestonesResponse> {
  return apiFetch<MilestonesResponse>(`/api/players/${profileId}/milestones`);
}

export async function getActivityPatterns(profileId: number | string): Promise<ActivityPatternsResponse> {
  return apiFetch<ActivityPatternsResponse>(`/api/players/${profileId}/activity`);
}

export async function getLiveMatches(): Promise<LiveMatchesResponse> {
  return apiFetch<LiveMatchesResponse>('/api/live');
}

export async function getEnhancedLeaderboard(params: {
  type?: string;
  page?: number;
  limit?: number;
  country?: string;
  clan?: string;
  min_rating?: number;
  max_rating?: number;
  search?: string;
}): Promise<EnhancedLeaderboardResponse> {
  return apiFetch<EnhancedLeaderboardResponse>('/api/ladder/enhanced', params as Record<string, string | number>);
}

export async function getLadderRangeStats(params: {
  type?: 'solo' | 'team';
  from?: number;
  to?: number;
  /** ask by place instead of by rating: the N best players, exactly N */
  top?: number;
  rating?: number;
  profile_id?: number | string;
}): Promise<LadderRangeStats> {
  return apiFetch<LadderRangeStats>('/api/ladder/range-stats', params as Record<string, string | number>);
}

export async function getEnhancedCountryStats(type: string = 'rm'): Promise<CountryStatsResponse> {
  return apiFetch<CountryStatsResponse>('/api/ladder/enhanced/countries', { type });
}

export async function getEnrichmentStatus(profileId: number | string): Promise<EnrichmentStatusResponse> {
  return apiFetch<EnrichmentStatusResponse>(`/api/players/${profileId}/enrich`);
}

export async function getMatchDetail(matchId: number | string): Promise<MatchDetailResponse> {
  return apiFetch<MatchDetailResponse>(`/api/matches/${matchId}`);
}

export async function getCivMeta(params: {
  match_type?: string;
  min_rating?: number;
  max_rating?: number;
  days?: number;
}): Promise<CivMetaResponse> {
  return apiFetch<CivMetaResponse>('/api/meta/civilizations', params as Record<string, string | number>);
}

export async function getCivMatchups(params: {
  match_type?: string;
  min_rating?: number;
  max_rating?: number;
  days?: number;
}): Promise<CivMatchupsResponse> {
  return apiFetch<CivMatchupsResponse>('/api/meta/civ-matchups', params as Record<string, string | number>);
}

export async function getLevelBenchmarks(params?: { match_type?: string }): Promise<LevelBenchmarksResponse> {
  return apiFetch<LevelBenchmarksResponse>('/api/meta/benchmarks', params as Record<string, string | number>);
}

/**
 * El diagnóstico: en qué está el jugador por debajo de los de su mismo tramo,
 * ordenado por lo que de verdad decide partidas. Los pesos los mide la API
 * comparando ganador y perdedor dentro de la misma partida.
 */
export async function getPlayerAssessment(
  profileId: number | string,
  params?: { match_type?: string }
): Promise<AssessmentResponse> {
  return apiFetch<AssessmentResponse>(
    `/api/players/${profileId}/assessment`,
    params as Record<string, string | number>
  );
}

/**
 * Contra qué build order jugaste cada apertura y cuánto te desviaste. Sólo
 * compara las edades para las que la guía da un objetivo.
 */
export async function getPlayerBuildOrders(
  profileId: number | string,
  params?: { match_type?: string }
): Promise<PlayerBuildOrdersResponse> {
  return apiFetch<PlayerBuildOrdersResponse>(
    `/api/players/${profileId}/build-orders`,
    params as Record<string, string | number>
  );
}

/**
 * Sube uno o varios .aoe2record y los analiza.
 *
 * No pasa por apiFetch porque va en multipart: el navegador tiene que poner el
 * boundary en Content-Type, asi que aqui NO se toca esa cabecera a mano.
 */
export async function analyzeReplays(ficheros: File[]): Promise<ReplayUploadResponse> {
  const cuerpo = new FormData();
  for (const f of ficheros) cuerpo.append('replay', f);
  const res = await fetch(`${BASE_URL}/api/replays/analyze`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: cuerpo,
  });
  if (!res.ok) {
    //  El 429 del limitador trae un mensaje util: conviene no tragarselo.
    let detalle = '';
    try {
      detalle = (await res.json())?.message ?? '';
    } catch { /* cuerpo no JSON */ }
    throw new Error(detalle || `API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** La cronología de una partida para el mapa. Se baja de Relic y se parsea al
 *  vuelo, así que tarda unos segundos la primera vez. */
export async function getMatchTimeline(matchId: number | string): Promise<MatchTimelineResponse> {
  return apiFetch<MatchTimelineResponse>(`/api/matches/${matchId}/timeline`);
}

export async function getMapMeta(params: {
  match_type?: string;
  days?: number;
}): Promise<MapMetaResponse> {
  return apiFetch<MapMetaResponse>('/api/meta/maps', params as Record<string, string | number>);
}

export async function enrichPlayerMatches(profileId: number | string): Promise<{ status: string; message: string }> {
  const fullUrl = BASE_URL ? `${BASE_URL}/api/players/${profileId}/enrich` : `/api/players/${profileId}/enrich`;
  const res = await fetch(fullUrl, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getPlayerSignals(profileId: number | string): Promise<PlayerSignalsResponse> {
  return apiFetch<PlayerSignalsResponse>(`/api/players/${profileId}/signals`);
}

/** Marcar rivales en un listado sin una peticion por rival. */
export async function getSignalFlags(profileIds: (number | string)[]): Promise<SignalFlagsResponse> {
  return apiFetch<SignalFlagsResponse>('/api/players/signals/flags', {
    profile_ids: profileIds.join(','),
  });
}
