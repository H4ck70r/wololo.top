import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { getEnhancedLeaderboard, getEnhancedCountryStats } from '../lib/api';
import { countryFlag } from '../lib/constants';
import type { EnhancedLeaderboardResponse, CountryStatsResponse } from '../lib/types';

const PAGE_SIZE = 50;

const LADDER_TYPES = [
  { id: 'rm', label: 'Solo RM' },
  { id: 'team-rm', label: 'Team RM' },
  { id: 'solo-dm', label: 'Solo DM' },
  { id: 'team-dm', label: 'Team DM' },
  { id: 'solo-ew', label: 'Solo EW' },
  { id: 'team-ew', label: 'Team EW' },
] as const;

type LadderType = (typeof LADDER_TYPES)[number]['id'];

export default function LeaderboardEnhanced() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial state from URL params
  const [ladderType, setLadderType] = useState<LadderType>(
    (searchParams.get('type') as LadderType) || 'rm'
  );
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [country, setCountry] = useState(searchParams.get('country') || '');
  const [clan, setClan] = useState(searchParams.get('clan') || '');
  const [minRating, setMinRating] = useState(searchParams.get('min_rating') || '');
  const [maxRating, setMaxRating] = useState(searchParams.get('max_rating') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedClan, setDebouncedClan] = useState(clan);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedClan(clan), 400);
    return () => clearTimeout(timer);
  }, [clan]);

  // Sync state to URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (ladderType !== 'rm') params.type = ladderType;
    if (page > 1) params.page = String(page);
    if (country) params.country = country;
    if (debouncedClan) params.clan = debouncedClan;
    if (minRating) params.min_rating = minRating;
    if (maxRating) params.max_rating = maxRating;
    if (debouncedSearch) params.search = debouncedSearch;
    setSearchParams(params, { replace: true });
  }, [ladderType, page, country, debouncedClan, minRating, maxRating, debouncedSearch, setSearchParams]);

  // Reset page when filters change
  const resetPage = useCallback(() => setPage(1), []);

  // Fetch leaderboard data
  const { data, isLoading, error } = useQuery<EnhancedLeaderboardResponse>({
    queryKey: ['enhanced-leaderboard', ladderType, page, country, debouncedClan, minRating, maxRating, debouncedSearch],
    queryFn: () =>
      getEnhancedLeaderboard({
        type: ladderType,
        page,
        limit: PAGE_SIZE,
        country: country || undefined,
        clan: debouncedClan || undefined,
        min_rating: minRating ? Number(minRating) : undefined,
        max_rating: maxRating ? Number(maxRating) : undefined,
        search: debouncedSearch || undefined,
      }),
  });

  // Fetch countries for dropdown
  const { data: countryData } = useQuery<CountryStatsResponse>({
    queryKey: ['enhanced-countries', ladderType],
    queryFn: () => getEnhancedCountryStats(ladderType),
    staleTime: 5 * 60 * 1000,
  });

  const players = data?.data?.players || [];
  const pagination = data?.data?.pagination;
  const totalPages = pagination?.pages || 1;
  const countries = countryData?.data?.countries || [];

  const handleTypeChange = (type: LadderType) => {
    setLadderType(type);
    resetPage();
  };

  const clearFilters = () => {
    setCountry('');
    setClan('');
    setMinRating('');
    setMaxRating('');
    setSearch('');
    setDebouncedSearch('');
    setDebouncedClan('');
    resetPage();
  };

  const hasActiveFilters = country || clan || minRating || maxRating || search;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 m-0">Leaderboard</h1>
            {pagination && (
              <p className="text-sm text-gray-500 mt-1 m-0">
                {pagination.total.toLocaleString()} players found
              </p>
            )}
          </div>
        </div>

        {/* Ladder type tabs */}
        <div className="flex flex-wrap bg-dark-600 rounded-xl p-1 border border-dark-400 gap-0.5">
          {LADDER_TYPES.map((lb) => (
            <button
              key={lb.id}
              onClick={() => handleTypeChange(lb.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-none cursor-pointer ${
                ladderType === lb.id
                  ? 'bg-gold-500 text-dark-900 shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 bg-transparent'
              }`}
            >
              {lb.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Search Player</label>
            <input
              type="text"
              placeholder="Alias or name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              className="w-full px-3 py-2 rounded-lg bg-dark-600 border border-dark-400 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-gold-500/50 transition-colors"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Country</label>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                resetPage();
              }}
              className="w-full px-3 py-2 rounded-lg bg-dark-600 border border-dark-400 text-gray-200 text-sm focus:outline-none focus:border-gold-500/50 transition-colors cursor-pointer"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c.country} value={c.country}>
                  {countryFlag(c.country)} {c.country.toUpperCase()} ({c.player_count.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Clan */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Clan</label>
            <input
              type="text"
              placeholder="Clan name..."
              value={clan}
              onChange={(e) => {
                setClan(e.target.value);
                resetPage();
              }}
              className="w-full px-3 py-2 rounded-lg bg-dark-600 border border-dark-400 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-gold-500/50 transition-colors"
            />
          </div>

          {/* Min Rating */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Min Rating</label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value);
                resetPage();
              }}
              className="w-full px-3 py-2 rounded-lg bg-dark-600 border border-dark-400 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-gold-500/50 transition-colors"
            />
          </div>

          {/* Max Rating */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">Max Rating</label>
            <input
              type="number"
              placeholder="e.g. 2500"
              value={maxRating}
              onChange={(e) => {
                setMaxRating(e.target.value);
                resetPage();
              }}
              className="w-full px-3 py-2 rounded-lg bg-dark-600 border border-dark-400 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-gold-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-500 text-gray-400 hover:text-gray-200 hover:bg-dark-400 transition-colors border-none cursor-pointer"
            >
              Clear all filters
            </button>
            {country && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-dark-500 text-xs text-gray-300">
                {countryFlag(country)} {country.toUpperCase()}
                <button
                  onClick={() => { setCountry(''); resetPage(); }}
                  className="ml-1 text-gray-500 hover:text-gray-200 bg-transparent border-none cursor-pointer text-xs"
                >
                  x
                </button>
              </span>
            )}
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-dark-500 text-xs text-gray-300">
                "{debouncedSearch}"
                <button
                  onClick={() => { setSearch(''); setDebouncedSearch(''); resetPage(); }}
                  className="ml-1 text-gray-500 hover:text-gray-200 bg-transparent border-none cursor-pointer text-xs"
                >
                  x
                </button>
              </span>
            )}
            {debouncedClan && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-dark-500 text-xs text-gray-300">
                Clan: {debouncedClan}
                <button
                  onClick={() => { setClan(''); setDebouncedClan(''); resetPage(); }}
                  className="ml-1 text-gray-500 hover:text-gray-200 bg-transparent border-none cursor-pointer text-xs"
                >
                  x
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Failed to load leaderboard data.</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No players match your filters.</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-dark-500 text-gray-300 hover:bg-dark-400 transition-colors border-none cursor-pointer"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-400 bg-dark-600/50">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium w-16">Rank</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Player</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Rating</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium hidden sm:table-cell">
                    Peak
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium hidden sm:table-cell">
                    W / L
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Win Rate</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium hidden md:table-cell">
                    Streak
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((entry) => {
                  const wr = parseFloat(entry.winrate) || 0;
                  return (
                    <tr
                      key={entry.profile_id}
                      className="border-b border-dark-500/50 hover:bg-dark-600/60 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`font-medium ${
                            entry.rank <= 3
                              ? 'text-gold-400'
                              : entry.rank <= 10
                              ? 'text-gray-300'
                              : 'text-gray-500'
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/player/${entry.profile_id}`}
                          className="flex items-center gap-2 no-underline group"
                        >
                          {entry.avatar && (
                            <img
                              src={entry.avatar}
                              alt=""
                              className="w-7 h-7 rounded-md object-cover flex-shrink-0"
                            />
                          )}
                          <span className="text-base flex-shrink-0">
                            {countryFlag(entry.country)}
                          </span>
                          <span className="font-medium text-gray-200 group-hover:text-gold-400 transition-colors truncate">
                            {entry.alias}
                          </span>
                          {entry.clanlist_name && (
                            <span className="text-xs text-gray-600 hidden lg:inline">
                              [{entry.clanlist_name}]
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-gold-400">{entry.rating}</span>
                      </td>
                      <td className="py-3 px-4 text-right hidden sm:table-cell">
                        <span className="text-gray-400">{entry.highestrating}</span>
                      </td>
                      <td className="py-3 px-4 text-right hidden sm:table-cell">
                        <span className="text-win">{entry.wins}</span>
                        <span className="text-gray-600 mx-1">/</span>
                        <span className="text-loss">{entry.losses}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-medium ${
                            wr >= 55 ? 'text-win' : wr >= 45 ? 'text-gray-300' : 'text-loss'
                          }`}
                        >
                          {wr.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right hidden md:table-cell">
                        <span
                          className={`font-medium ${
                            entry.streak > 0
                              ? 'text-win'
                              : entry.streak < 0
                              ? 'text-loss'
                              : 'text-gray-500'
                          }`}
                        >
                          {entry.streak > 0 ? `+${entry.streak}` : entry.streak}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-400">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-dark-500 text-gray-300 hover:bg-dark-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-none cursor-pointer"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {/* Jump-to-page buttons for nearby pages */}
              {page > 2 && (
                <button
                  onClick={() => setPage(1)}
                  className="w-8 h-8 rounded-lg text-xs font-medium bg-dark-500 text-gray-400 hover:bg-dark-400 hover:text-gray-200 transition-colors border-none cursor-pointer"
                >
                  1
                </button>
              )}
              {page > 3 && <span className="text-gray-600 text-xs">...</span>}
              {page > 1 && (
                <button
                  onClick={() => setPage(page - 1)}
                  className="w-8 h-8 rounded-lg text-xs font-medium bg-dark-500 text-gray-400 hover:bg-dark-400 hover:text-gray-200 transition-colors border-none cursor-pointer"
                >
                  {page - 1}
                </button>
              )}
              <span className="w-8 h-8 rounded-lg text-xs font-bold bg-gold-500 text-dark-900 flex items-center justify-center">
                {page}
              </span>
              {page < totalPages && (
                <button
                  onClick={() => setPage(page + 1)}
                  className="w-8 h-8 rounded-lg text-xs font-medium bg-dark-500 text-gray-400 hover:bg-dark-400 hover:text-gray-200 transition-colors border-none cursor-pointer"
                >
                  {page + 1}
                </button>
              )}
              {page < totalPages - 2 && <span className="text-gray-600 text-xs">...</span>}
              {page < totalPages - 1 && (
                <button
                  onClick={() => setPage(totalPages)}
                  className="w-8 h-8 rounded-lg text-xs font-medium bg-dark-500 text-gray-400 hover:bg-dark-400 hover:text-gray-200 transition-colors border-none cursor-pointer"
                >
                  {totalPages}
                </button>
              )}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-dark-500 text-gray-300 hover:bg-dark-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-none cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
