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
  params?: { limit?: number; offset?: number }
): Promise<MatchesResponse> {
  return apiFetch<MatchesResponse>(`/api/players/${profileId}/matches`, params as Record<string, string | number>);
}

export async function getHeadToHead(
  profileId: number | string,
  opponentId: number | string
): Promise<HeadToHeadData> {
  return apiFetch<HeadToHeadData>(`/api/players/${profileId}/head-to-head/${opponentId}`);
}

export async function getLeaderboard(
  type: 'rm' | 'team-rm' = 'rm',
  params?: { limit?: number; page?: number }
): Promise<LeaderboardResponse> {
  return apiFetch<LeaderboardResponse>(`/api/ladder/${type}`, params as Record<string, string | number>);
}
