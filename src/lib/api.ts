const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://aoe2api.pr070c01.com';
const API_KEY = import.meta.env.VITE_API_KEY || '';

async function apiFetch<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
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
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

import type {
  PlayerSearchResult,
  PlayerProfile,
  PlayerStats,
  Match,
  HeadToHeadData,
  LeaderboardResponse,
} from './types';

export async function searchPlayers(query: string): Promise<PlayerSearchResult[]> {
  return apiFetch<PlayerSearchResult[]>('/api/players/search', { q: query });
}

export async function getPlayer(profileId: number | string): Promise<PlayerProfile> {
  return apiFetch<PlayerProfile>(`/api/players/${profileId}`);
}

export async function getPlayerStats(profileId: number | string): Promise<PlayerStats> {
  return apiFetch<PlayerStats>(`/api/players/${profileId}/stats`);
}

export async function getPlayerMatches(
  profileId: number | string,
  params?: { start?: number; count?: number }
): Promise<Match[]> {
  return apiFetch<Match[]>(`/api/players/${profileId}/matches`, params as Record<string, string | number>);
}

export async function getHeadToHead(
  profileId: number | string,
  opponentId: number | string
): Promise<HeadToHeadData> {
  return apiFetch<HeadToHeadData>(`/api/players/${profileId}/head-to-head/${opponentId}`);
}

export async function getLeaderboard(params: {
  leaderboard_id: number;
  start?: number;
  count?: number;
}): Promise<LeaderboardResponse> {
  return apiFetch<LeaderboardResponse>('/api/leaderboard', params as Record<string, string | number>);
}
