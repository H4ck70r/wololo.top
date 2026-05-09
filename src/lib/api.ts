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

export async function getEnhancedCountryStats(type: string = 'rm'): Promise<CountryStatsResponse> {
  return apiFetch<CountryStatsResponse>('/api/ladder/enhanced/countries', { type });
}

export async function getEnrichmentStatus(profileId: number | string): Promise<EnrichmentStatusResponse> {
  return apiFetch<EnrichmentStatusResponse>(`/api/players/${profileId}/enrich`);
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
