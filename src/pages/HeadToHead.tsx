import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { getHeadToHead, getPlayer } from '../lib/api';
import { getCivName, cleanMapName, formatDuration } from '../lib/constants';
import SearchBar from '../components/SearchBar';

export default function HeadToHead() {
  const { profileId, opponentId } = useParams<{ profileId: string; opponentId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['h2h', profileId, opponentId],
    queryFn: () => getHeadToHead(profileId!, opponentId!),
    enabled: !!profileId && !!opponentId,
  });

  const { data: playerData } = useQuery({
    queryKey: ['player', profileId],
    queryFn: () => getPlayer(profileId!),
    enabled: !!profileId,
  });

  const { data: opponentData } = useQuery({
    queryKey: ['player', opponentId],
    queryFn: () => getPlayer(opponentId!),
    enabled: !!opponentId,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-300 mb-4">Head to Head Not Found</h2>
        <p className="text-gray-500 mb-6">No matches found between these players.</p>
        <SearchBar className="max-w-lg mx-auto" />
      </div>
    );
  }

  const player = playerData?.player;
  const opponent = opponentData?.player;
  const playerName = player?.alias || `Player ${profileId}`;
  const opponentName = opponent?.alias || `Player ${opponentId}`;

  const { total_games, wins, losses, win_rate, civ_matchups, map_stats, recent_matches } = data;
  const playerPct = total_games > 0 ? (wins / total_games) * 100 : 50;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Helmet>
        <title>{playerName} vs {opponentName} - wololo.top</title>
        <meta name="description" content={`Head-to-head: ${playerName} vs ${opponentName}. ${total_games} games, ${wins}-${losses} record (${win_rate}% win rate).`} />
        <link rel="canonical" href={`https://wololo.top/h2h/${profileId}/${opponentId}`} />
      </Helmet>
      {/* Players header */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {player?.avatar ? (
              <img src={player.avatar} alt={playerName} className="w-14 h-14 rounded-xl object-cover border-2 border-dark-400" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-dark-500 flex items-center justify-center text-xl font-bold text-gold-400">
                {playerName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-xl text-gold-400 m-0">{playerName}</p>
              <p className="text-sm text-gray-500 m-0">{win_rate}% win rate</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-3xl font-black text-gray-400 m-0">VS</p>
            <p className="text-xs text-gray-500 mt-1 m-0">{total_games} games</p>
          </div>

          <div className="flex items-center gap-3 flex-row-reverse">
            {opponent?.avatar ? (
              <img src={opponent.avatar} alt={opponentName} className="w-14 h-14 rounded-xl object-cover border-2 border-dark-400" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-dark-500 flex items-center justify-center text-xl font-bold text-blue-accent">
                {opponentName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-right">
              <p className="font-bold text-xl text-blue-accent m-0">{opponentName}</p>
              <p className="text-sm text-gray-500 m-0">{(100 - win_rate).toFixed(1)}% win rate</p>
            </div>
          </div>
        </div>

        {/* Win bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gold-400">{wins} wins</span>
            <span className="text-sm font-bold text-blue-accent">{losses} wins</span>
          </div>
          <div className="w-full h-4 bg-dark-400 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-500"
              style={{ width: `${playerPct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-blue-accent to-blue-500 transition-all duration-500"
              style={{ width: `${100 - playerPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Civ matchups & Map stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4 m-0">Civilization Matchups</h2>
          {civ_matchups && civ_matchups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-400">
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">{playerName}</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">{opponentName}</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium">Games</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {civ_matchups.slice(0, 20).map((m, i) => (
                    <tr key={i} className="border-b border-dark-500/50 hover:bg-dark-600/50">
                      <td className="py-2 px-2 text-gray-200">{m.player_civ_name || getCivName(m.player_civ)}</td>
                      <td className="py-2 px-2 text-gray-200">{m.opponent_civ_name || getCivName(m.opponent_civ)}</td>
                      <td className="py-2 px-2 text-right text-gray-400">{m.games}</td>
                      <td className="py-2 px-2 text-right">
                        <span className="text-gold-400">{m.wins}</span>
                        <span className="text-gray-600 mx-1">-</span>
                        <span className="text-blue-accent">{m.losses}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No civ matchup data available.</p>
          )}
        </div>

        <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4 m-0">Map Stats</h2>
          {map_stats && map_stats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-400">
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Map</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium">Games</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {map_stats.map((m, i) => (
                    <tr key={i} className="border-b border-dark-500/50 hover:bg-dark-600/50">
                      <td className="py-2 px-2 text-gray-200">{m.map || cleanMapName(m.map_name)}</td>
                      <td className="py-2 px-2 text-right text-gray-400">{m.games}</td>
                      <td className="py-2 px-2 text-right">
                        <span className="text-gold-400">{m.wins}</span>
                        <span className="text-gray-600 mx-1">-</span>
                        <span className="text-blue-accent">{m.losses}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No map data available.</p>
          )}
        </div>
      </div>

      {/* Recent matches */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 m-0">Recent Matches</h2>
        {recent_matches && recent_matches.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recent_matches.map((match) => {
              const isPlayerWin = match.player_result === 1;
              const ratingChange =
                match.player_old_rating != null && match.player_new_rating != null
                  ? match.player_new_rating - match.player_old_rating
                  : null;
              const startedAt = match.started_at ? new Date(match.started_at) : null;

              return (
                <div
                  key={match.match_id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                    isPlayerWin
                      ? 'bg-win/5 border-win/20'
                      : 'bg-loss/5 border-loss/20'
                  }`}
                >
                  <div
                    className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isPlayerWin ? 'bg-win/20 text-win' : 'bg-loss/20 text-loss'
                    }`}
                  >
                    {isPlayerWin ? 'W' : 'L'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="font-medium text-gold-400">
                        {match.player_civ_name || getCivName(match.player_civ)}
                      </span>
                      <span className="text-gray-600">vs</span>
                      <span className="font-medium text-blue-accent">
                        {match.opponent_civ_name || getCivName(match.opponent_civ)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{match.map || cleanMapName(match.map_name)}</span>
                      {match.duration_seconds && <span>{formatDuration(match.duration_seconds)}</span>}
                      {startedAt && <span>{startedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                    </div>
                  </div>
                  {ratingChange !== null && (
                    <span
                      className={`text-sm font-medium ${
                        ratingChange > 0 ? 'text-win' : 'text-loss'
                      }`}
                    >
                      {ratingChange > 0 ? `+${ratingChange}` : ratingChange}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-8">No matches between these players found.</p>
        )}
      </div>
    </div>
  );
}
