import { useT } from '../lib/i18n';
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getEnhancedLeaderboard, getEnhancedCountryStats, getPlayer } from '../lib/api';
import LadderDistributionChart from '../components/LadderDistributionChart';
import EloInflationChart from '../components/EloInflationChart';
import { useSession } from '../lib/session';
import CountryFilter from '../components/CountryFilter';
import { countryFlag, countryName } from '../lib/constants';
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
  const { t, lang } = useT();
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
  // En movil los cinco filtros dejaban la tabla debajo del pliegue: solo se
  // ve la busqueda y los otros cuatro viven detras de este boton.
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  // Lo mismo con las dos graficas: en un movil dejaban la clasificacion casi
  // dos pantallas mas abajo, y la clasificacion es a lo que se viene.
  const [graficosAbiertos, setGraficosAbiertos] = useState(false);

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

  // The curve only exists for the two RM ladders.
  const distLadder = ladderType === 'rm' ? 'solo' : ladderType === 'team-rm' ? 'team' : null;

  // The selection is not separate state: it IS the rating filter, so typing a
  // range highlights its band and clearing the filters clears the curve.
  const chartRange =
    minRating && maxRating ? { from: Number(minRating), to: Number(maxRating) } : null;

  const applyBand = useCallback(
    (band: { from: number; to: number } | null) => {
      setMinRating(band ? String(band.from) : '');
      setMaxRating(band ? String(band.to) : '');
      resetPage();
    },
    [resetPage]
  );

  // Signed in, the curve marks where you are on the ladder you are browsing.
  const { user } = useSession();
  const { data: me } = useQuery({
    queryKey: ['player', user?.profile_id],
    queryFn: () => getPlayer(String(user!.profile_id)),
    enabled: !!user?.profile_id,
    staleTime: 10 * 60 * 1000,
  });
  const myRating = distLadder
    ? me?.player?.ladders?.find((l) => l.type === distLadder)?.rating
    : undefined;

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
  const filtrosAvanzados = [country, clan, minRating, maxRating].filter(Boolean).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Helmet>
        <title>Leaderboard - wololo.top</title>
        <meta name="description" content="Age of Empires II DE ranked leaderboard. Browse top players by rating, filter by country, clan, or rating range." />
        <link rel="canonical" href="https://wololo.top/leaderboard" />
      </Helmet>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 m-0">{t('lb.title')}</h1>
            {pagination && (
              <p className="text-sm text-gray-500 mt-1 m-0">
                {t('lb.playersFound', { n: pagination.total.toLocaleString() })}
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

      {/* The curve doubles as a filter: picking a band narrows the table below,
          which is why its own player listing is switched off here. La segunda
          grafica es la misma curva contra la de hace meses: si el ladder entero
          se desplazo, los cortes de las bandas no significan hoy lo que
          significaban. */}
      {distLadder && (
        <div className="mb-4">
          <button
            onClick={() => setGraficosAbiertos((v) => !v)}
            aria-expanded={graficosAbiertos}
            className="md:hidden w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-dark-700 border border-dark-400 text-gray-300 text-sm cursor-pointer transition-colors hover:border-gold-500/50"
          >
            <span className="text-left">{t('lb.ratingCharts')}</span>
            <svg
              className={`w-3.5 h-3.5 shrink-0 transition-transform ${graficosAbiertos ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div className={`${graficosAbiertos ? 'block' : 'hidden'} md:block`}>
            <div className="mt-3 md:mt-0 mb-4">
              <LadderDistributionChart
                ladder={distLadder}
                rating={myRating}
                isSelf
                range={chartRange}
                onRangeChange={applyBand}
                showPlayers={false}
              />
            </div>
            <EloInflationChart ladder={distLadder} rating={myRating} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-3 sm:p-4 mb-4">
        <div className="flex items-end gap-2">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-gray-500 mb-1 font-medium">{t('lb.searchPlayer')}</label>
            <input
              type="text"
              placeholder={t('lb.aliasPlaceholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              className="w-full px-3 py-2 rounded-lg bg-dark-600 border border-dark-400 text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:border-gold-500/50 transition-colors"
            />
          </div>

          <button
            onClick={() => setFiltrosAbiertos((v) => !v)}
            aria-expanded={filtrosAbiertos}
            className="sm:hidden shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-600 border border-dark-400 text-gray-300 text-sm cursor-pointer transition-colors hover:border-gold-500/50"
          >
            <span className="whitespace-nowrap">
              {filtrosAbiertos ? t('lb.hideFilters') : t('lb.moreFilters')}
            </span>
            {filtrosAvanzados > 0 && (
              <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-gold-500/20 text-gold-400 text-[10px] font-semibold">
                {filtrosAvanzados}
              </span>
            )}
            <svg
              className={`w-3 h-3 shrink-0 transition-transform ${filtrosAbiertos ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        <div
          className={`${filtrosAbiertos ? 'grid' : 'hidden'} sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3`}
        >
          {/* Country */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">{t('lb.country')}</label>
            <CountryFilter
              value={country}
              countries={countries}
              onChange={(code) => { setCountry(code); resetPage(); }}
            />
          </div>

          {/* Clan */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 font-medium">{t('lb.clan')}</label>
            <input
              type="text"
              placeholder={t('lb.clanPlaceholder')}
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
            <label className="block text-xs text-gray-500 mb-1 font-medium">{t('lb.minRating')}</label>
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
            <label className="block text-xs text-gray-500 mb-1 font-medium">{t('lb.maxRating')}</label>
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
              {t('lb.clearFilters')}
            </button>
            {country && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-dark-500 text-xs text-gray-300">
                {countryFlag(country)} {countryName(country, lang) || country.toUpperCase()}
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
            <p className="text-gray-500">{t('lb.failed')}</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('lb.noMatch')}</p>
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
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-dark-400 bg-dark-600/50">
                  <th className="text-left py-3 px-1.5 sm:px-4 text-gray-400 font-medium w-12 sm:w-16">{t('common.rank')}</th>
                  <th className="text-left py-3 px-1.5 sm:px-4 text-gray-400 font-medium">{t('common.player')}</th>
                  <th className="text-right py-3 px-1.5 sm:px-4 text-gray-400 font-medium">{t('common.rating')}</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium hidden sm:table-cell">
                    {t('lb.peak')}
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium hidden sm:table-cell">
                    {t('lb.wl')}
                  </th>
                  <th className="text-right py-3 px-1.5 sm:px-4 text-gray-400 font-medium"><span className="sm:hidden">{t('common.winRateShort')}</span><span className="hidden sm:inline">{t('common.winRate')}</span></th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium hidden md:table-cell">
                    {t('common.streak')}
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
                      <td className="py-3 px-1.5 sm:px-4">
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
                      <td className="py-3 px-1.5 sm:px-4">
                        <Link
                          to={`/player/${entry.profile_id}`}
                          className="flex items-center gap-1.5 sm:gap-2 no-underline group min-w-0"
                        >
                          {entry.avatar && (
                            <img
                              src={entry.avatar}
                              alt=""
                              className="hidden sm:block w-7 h-7 rounded-md object-cover flex-shrink-0"
                            />
                          )}
                          <span className="text-base flex-shrink-0">
                            {countryFlag(entry.country)}
                          </span>
                          <span className="font-medium text-gray-200 group-hover:text-gold-400 transition-colors truncate min-w-0">
                            {entry.alias}
                          </span>
                          {entry.clanlist_name && (
                            <Link
                              to={`/clan/${encodeURIComponent(entry.clanlist_name)}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-gray-600 hover:text-gold-400 no-underline hidden lg:inline transition-colors"
                            >
                              [{entry.clanlist_name}]
                            </Link>
                          )}
                        </Link>
                      </td>
                      <td className="py-3 px-1.5 sm:px-4 text-right">
                        <span className="font-bold text-gold-400">{entry.rating}</span>
                      </td>
                      <td className="py-3 px-1.5 sm:px-4 text-right hidden sm:table-cell">
                        <span className="text-gray-400">{entry.highestrating}</span>
                      </td>
                      <td className="py-3 px-1.5 sm:px-4 text-right hidden sm:table-cell">
                        <span className="text-win">{entry.wins}</span>
                        <span className="text-gray-600 mx-1">/</span>
                        <span className="text-loss">{entry.losses}</span>
                      </td>
                      <td className="py-3 px-1.5 sm:px-4 text-right">
                        <span
                          className={`font-medium ${
                            wr >= 55 ? 'text-win' : wr >= 45 ? 'text-gray-300' : 'text-loss'
                          }`}
                        >
                          {wr.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-1.5 sm:px-4 text-right hidden md:table-cell">
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
