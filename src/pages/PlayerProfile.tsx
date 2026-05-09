import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getPlayer, getPlayerStats, getPlayerMatches } from '../lib/api';
import { countryFlag } from '../lib/constants';
import RatingCard from '../components/RatingCard';
import RatingChart from '../components/RatingChart';
import CivStatsTable from '../components/CivStatsTable';
import MapStatsTable from '../components/MapStatsTable';
import MatchRow from '../components/MatchRow';
import SearchBar from '../components/SearchBar';

export default function PlayerProfile() {
  const { profileId } = useParams<{ profileId: string }>();

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
    queryKey: ['playerMatches', profileId],
    queryFn: () => getPlayerMatches(profileId!, { limit: 50 }),
    enabled: !!profileId,
  });

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
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
            </div>
            <p className="text-sm text-gray-500 mt-1 m-0">Profile ID: {player.profile_id}</p>
          </div>
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

      {/* Rating history chart */}
      <div className="mb-6">
        <RatingChart profileId={profileId!} />
      </div>

      {/* Civ & Map stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4 m-0">Civilization Stats</h2>
          {loadingStats ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <CivStatsTable stats={stats?.civ_stats || []} />
          )}
        </div>
        <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4 m-0">Map Stats</h2>
          {loadingStats ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <MapStatsTable stats={stats?.map_stats || []} />
          )}
        </div>
      </div>

      {/* Recent matches */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 m-0">Recent Matches</h2>
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
      </div>
    </div>
  );
}
