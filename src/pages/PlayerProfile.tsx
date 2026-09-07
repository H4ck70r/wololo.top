import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getPlayer, getPlayerStats, getPlayerMatches, getEnrichmentStatus, enrichPlayerMatches } from '../lib/api';
import { countryFlag, MATCH_FILTERS } from '../lib/constants';
import { isFavorite, addFavorite, removeFavorite } from '../lib/favorites';
import { outcomeOf, OUTCOME_LABEL, OUTCOME_BADGE, OUTCOME_CHIP } from '../lib/matchResult';
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
  const [copied, setCopied] = useState(false);
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
              <Link
                to={`/compare?p1=${profileId}`}
                className="px-3 py-1.5 text-xs font-medium bg-dark-500 hover:bg-dark-400 text-gray-300 hover:text-gold-400 rounded-lg transition-colors no-underline flex items-center gap-1.5"
                title="Compare with another player"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                Compare
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-1 m-0">Profile ID: {player.profile_id}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {enriching && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gold-500/10 border border-gold-500/20 rounded-lg">
                <div className="w-3 h-3 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gold-400">Enriching...</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://wololo.top/player/${profileId}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-1.5 rounded-lg bg-dark-500 hover:bg-dark-400 text-gray-400 hover:text-gray-200 transition-colors"
                title={copied ? 'Copied!' : 'Copy link'}
              >
                {copied ? (
                  <svg className="w-4 h-4 text-win" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.798" />
                  </svg>
                )}
              </button>
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Check out ${player.alias}'s AOE2 profile on wololo.top!`)}&url=${encodeURIComponent(`https://wololo.top/player/${profileId}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-dark-500 hover:bg-dark-400 text-gray-400 hover:text-gray-200 transition-colors"
                title="Share on X"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${player.alias} on wololo.top — https://wololo.top/player/${profileId}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-dark-500 hover:bg-dark-400 text-gray-400 hover:text-gray-200 transition-colors"
                title="Share on WhatsApp"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Recent form */}
      {matches.length > 0 && (
        <div className="bg-dark-700 border border-dark-400 rounded-xl px-5 py-3 mb-6 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Recent Form</span>
          <div className="flex items-center gap-1">
            {matches.slice(0, 10).map((m, i) => (
              <span
                key={i}
                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${OUTCOME_CHIP[outcomeOf(m.result)]}`}
                title={`${OUTCOME_LABEL[outcomeOf(m.result)]} — ${m.civilization || ''} on ${m.map || m.map_name || ''}`}
              >
                {OUTCOME_BADGE[outcomeOf(m.result)]}
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-auto">
            {matches.slice(0, 10).filter(m => m.result === 1).length}W {matches.slice(0, 10).filter(m => m.result === 0).length}L
            {matches.slice(0, 10).some(m => outcomeOf(m.result) === 'pending') &&
              ` · ${matches.slice(0, 10).filter(m => outcomeOf(m.result) === 'pending').length} pending`}
          </span>
        </div>
      )}

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
