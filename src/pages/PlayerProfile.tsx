import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getPlayer, getPlayerStats, getPlayerMatches, getEnrichmentStatus, enrichPlayerMatches } from '../lib/api';
import { countryFlag, MATCH_FILTERS } from '../lib/constants';
import { isFavorite, addFavorite, removeFavorite } from '../lib/favorites';
import RatingCard from '../components/RatingCard';
import RatingChart from '../components/RatingChart';
import CivStatsTable from '../components/CivStatsTable';
import MapStatsTable from '../components/MapStatsTable';
import RatingTrends from '../components/RatingTrends';
import RivalsSection from '../components/RivalsSection';
import MilestonesTimeline from '../components/MilestonesTimeline';
import ActivityHeatmap from '../components/ActivityHeatmap';
import MatchRow from '../components/MatchRow';
import SearchBar from '../components/SearchBar';

const MATCHES_PER_PAGE = 50;

export default function PlayerProfile() {
  const { profileId } = useParams<{ profileId: string }>();
  const [matchFilter, setMatchFilter] = useState('');
  const [matchPage, setMatchPage] = useState(1);
  const [enriching, setEnriching] = useState(false);
  const [starred, setStarred] = useState(false);
  const enrichTriggered = useRef(false);
  const matchesSectionRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: playerData, isLoading: loadingPlayer, error: playerError } = useQuery({
    queryKey: ['player', profileId],
    queryFn: () => getPlayer(profileId!),
    enabled: !!profileId,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['playerStats', profileId],
    queryFn: () => getPlayerStats(profileId!),
    enabled: !!profileId,
  });

  const { data: matchesData, isLoading: loadingMatches } = useQuery({
    queryKey: ['playerMatches', profileId, matchFilter, matchPage],
    queryFn: () => getPlayerMatches(profileId!, {
      limit: MATCHES_PER_PAGE,
      offset: (matchPage - 1) * MATCHES_PER_PAGE,
      match_type: matchFilter || undefined,
    }),
    enabled: !!profileId,
  });

  // Auto-enrich: check if player needs more match data
  useEffect(() => {
    if (!profileId || enrichTriggered.current) return;
    enrichTriggered.current = true;

    getEnrichmentStatus(profileId).then((status) => {
      if (status.needs_enrichment && status.can_enrich) {
        setEnriching(true);
        enrichPlayerMatches(profileId)
          .then(() => {
            // Wait a bit for background enrichment to insert rows, then refresh queries
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['playerMatches', profileId] });
              queryClient.invalidateQueries({ queryKey: ['playerStats', profileId] });
              queryClient.invalidateQueries({ queryKey: ['opponentAnalysis', profileId] });
              queryClient.invalidateQueries({ queryKey: ['activityPatterns', profileId] });
              queryClient.invalidateQueries({ queryKey: ['ratingTrends', profileId] });
              setEnriching(false);
            }, 8000);
          })
          .catch(() => setEnriching(false));
      }
    }).catch(() => {});
  }, [profileId, queryClient]);

  // Sync favorite state
  useEffect(() => {
    if (profileId) {
      setStarred(isFavorite(Number(profileId)));
    }
  }, [profileId]);

  const toggleFavorite = () => {
    if (!player || !profileId) return;
    const pid = Number(profileId);
    if (starred) {
      removeFavorite(pid);
      setStarred(false);
    } else {
      const soloRating = player.ladders?.find((l) => l.type === 'solo')?.rating ?? null;
      const added = addFavorite({
        profileId: pid,
        alias: player.alias,
        country: player.country,
        rating: soloRating,
        avatar: player.avatar,
      });
      if (added) setStarred(true);
    }
  };

  if (loadingPlayer) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const player = playerData?.player;

  if (playerError || !player) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-300 mb-4">Player Not Found</h2>
        <p className="text-gray-500 mb-6">Could not find a player with profile ID: {profileId}</p>
        <SearchBar className="max-w-lg mx-auto" />
      </div>
    );
  }

  const soloLadder = player.ladders?.find((l) => l.type === 'solo');
  const teamLadder = player.ladders?.find((l) => l.type === 'team');

  const totalWins = player.wins || 0;
  const totalLosses = player.losses || 0;
  const totalGames = totalWins + totalLosses;
  const overallWinRate = player.winrate ? parseFloat(player.winrate) : 0;

  const donutData = [
    { name: 'Wins', value: totalWins },
    { name: 'Losses', value: totalLosses },
  ];
  const DONUT_COLORS = ['#22c55e', '#ef4444'];

  const matches = matchesData?.matches || [];
  const totalMatches = matchesData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalMatches / MATCHES_PER_PAGE));

  const handleFilterChange = (value: string) => {
    setMatchFilter(value);
    setMatchPage(1);
  };

  const handlePageChange = (page: number) => {
    setMatchPage(page);
    matchesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (matchPage > 4) pages.push('ellipsis');
    const start = Math.max(2, matchPage - 2);
    const end = Math.min(totalPages - 1, matchPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    if (matchPage < totalPages - 3) pages.push('ellipsis');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const pageTitle = player ? `${player.alias} - wololo.top` : 'Player Profile - wololo.top';
  const pageDesc = player && soloLadder
    ? `${player.alias} — Rating ${soloLadder.rating} (Rank #${soloLadder.rank}), ${overallWinRate}% win rate, ${totalGames} games played.`
    : player
    ? `${player.alias} — ${overallWinRate}% win rate, ${totalGames} games played on AOE2 DE.`
    : 'AOE2 DE player profile and match history.';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={`https://wololo.top/player/${profileId}`} />
        {player?.avatar && <meta property="og:image" content={player.avatar} />}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        <link rel="canonical" href={`https://wololo.top/player/${profileId}`} />
      </Helmet>
      {/* Player header */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {player.avatar ? (
            <img
              src={player.avatar}
              alt={player.alias}
              className="w-16 h-16 rounded-xl object-cover border-2 border-dark-400"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-dark-500 flex items-center justify-center text-2xl font-bold text-gold-400">
              {player.alias.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 m-0">{player.alias}</h1>
              {player.country && (
                <span className="text-2xl" title={player.country.toUpperCase()}>
                  {countryFlag(player.country)}
                </span>
              )}
              <button
                onClick={toggleFavorite}
                title={starred ? 'Remove from favorites' : 'Add to favorites'}
                className="p-1 transition-colors"
              >
                {starred ? (
                  <svg className="w-6 h-6 text-gold-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-gray-500 hover:text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1 m-0">Profile ID: {player.profile_id}</p>
          </div>
          {enriching && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gold-500/10 border border-gold-500/20 rounded-lg">
              <div className="w-3 h-3 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gold-400">Enriching match history...</span>
            </div>
          )}
        </div>
      </div>

      {/* Rating cards + win rate donut */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <RatingCard
          label="Solo Ranked"
          rating={soloLadder?.rating}
          rank={soloLadder?.rank}
          wins={soloLadder?.wins}
          losses={soloLadder?.losses}
          streak={player.streak}
          highest={undefined}
          color="gold"
        />
        <RatingCard
          label="Team Ranked"
          rating={teamLadder?.rating}
          rank={teamLadder?.rank}
          wins={teamLadder?.wins}
          losses={teamLadder?.losses}
          streak={undefined}
          highest={undefined}
          color="blue"
        />

        <div className="bg-dark-700 border border-dark-400 rounded-xl p-5 flex flex-col items-center justify-center">
          <p className="text-sm text-gray-400 uppercase tracking-wider font-medium m-0 mb-3">Overall Win Rate</p>
          {totalGames > 0 ? (
            <div className="relative w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((_, index) => (
                      <Cell key={index} fill={DONUT_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1d28', border: '1px solid #2e3345', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-200">{overallWinRate}%</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No games played</p>
          )}
          <p className="text-xs text-gray-500 mt-2 m-0">
            {totalWins}W / {totalLosses}L ({totalGames} games)
          </p>
        </div>
      </div>

      {/* Rating trends (deltas, streaks) */}
      <div className="mb-6">
        <RatingTrends profileId={profileId!} />
      </div>

      {/* Rating history chart */}
      <div className="mb-6">
        <RatingChart profileId={profileId!} />
      </div>

      {/* Civ & Map stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200 m-0">Civilization Stats</h2>
            {stats && (
              <span className="text-xs text-gray-500">Based on {stats.total_matches} matches</span>
            )}
          </div>
          {loadingStats ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <CivStatsTable stats={stats?.civ_stats || []} />
          )}
        </div>
        <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200 m-0">Map Stats</h2>
            {stats && (
              <span className="text-xs text-gray-500">Based on {stats.total_matches} matches</span>
            )}
          </div>
          {loadingStats ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <MapStatsTable stats={stats?.map_stats || []} />
          )}
        </div>
      </div>

      {/* Rivals / Opponent Analysis */}
      <div className="mb-6">
        <RivalsSection profileId={profileId!} />
      </div>

      {/* Rating Milestones */}
      <div className="mb-6">
        <MilestonesTimeline profileId={profileId!} />
      </div>

      {/* Activity Heatmap */}
      <div className="mb-6">
        <ActivityHeatmap profileId={profileId!} />
      </div>

      {/* Recent matches */}
      <div ref={matchesSectionRef} className="bg-dark-700 border border-dark-400 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-200 m-0">Recent Matches</h2>
            {matchesData && (
              <span className="text-xs text-gray-500">{matchesData.total} total</span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {MATCH_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => handleFilterChange(f.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  matchFilter === f.value
                    ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {loadingMatches ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matches.length > 0 ? (
          <div className="flex flex-col gap-2">
            {matches.map((match) => (
              <MatchRow key={match.match_id} match={match} profileId={profileId} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">No recent matches found.</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-400 flex-wrap gap-3">
            <span className="text-xs text-gray-500">
              Page {matchPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(matchPage - 1)}
                disabled={matchPage === 1}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  matchPage === 1
                    ? 'text-gray-600 border-transparent cursor-not-allowed'
                    : 'text-gray-400 border-dark-400 hover:text-gray-200 hover:border-gray-500'
                }`}
              >
                Previous
              </button>
              {getPageNumbers().map((page, idx) =>
                page === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-gray-600">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                      matchPage === page
                        ? 'bg-gold-400/20 text-gold-400 border-gold-400/30'
                        : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => handlePageChange(matchPage + 1)}
                disabled={matchPage === totalPages}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                  matchPage === totalPages
                    ? 'text-gray-600 border-transparent cursor-not-allowed'
                    : 'text-gray-400 border-dark-400 hover:text-gray-200 hover:border-gray-500'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
