import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getHeadToHead } from '../lib/api';
import { countryFlag, getCivName, cleanMapName, formatTimeAgo, formatDuration } from '../lib/constants';
import SearchBar from '../components/SearchBar';

export default function HeadToHead() {
  const { profileId, opponentId } = useParams<{ profileId: string; opponentId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['h2h', profileId, opponentId],
    queryFn: () => getHeadToHead(profileId!, opponentId!),
    enabled: !!profileId && !!opponentId,
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
        <p className="text-gray-500 mb-6">Could not load head-to-head data for these players.</p>
        <SearchBar className="max-w-lg mx-auto" />
      </div>
    );
  }

  const { player, opponent, total_games, player_wins, opponent_wins, civ_matchups, map_stats, recent_matches } = data;
  const playerPct = total_games > 0 ? (player_wins / total_games) * 100 : 50;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Players header */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Player 1 */}
          <Link to={`/player/${player.profile_id}`} className="flex items-center gap-3 no-underline group">
            {player.avatar ? (
              <img src={player.avatar} alt={player.name} className="w-14 h-14 rounded-xl object-cover border-2 border-dark-400" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-dark-500 flex items-center justify-center text-xl font-bold text-gold-400">
                {player.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-xl text-gray-200 group-hover:text-gold-400 transition-colors m-0">
                {player.name}
              </p>
              {player.country && <span className="text-lg">{countryFlag(player.country)}</span>}
            </div>
          </Link>

          {/* VS badge */}
          <div className="text-center">
            <p className="text-3xl font-black text-gold-400 m-0">VS</p>
            <p className="text-xs text-gray-500 mt-1 m-0">{total_games} games</p>
          </div>

          {/* Player 2 */}
          <Link to={`/player/${opponent.profile_id}`} className="flex items-center gap-3 no-underline group flex-row-reverse">
            {opponent.avatar ? (
              <img src={opponent.avatar} alt={opponent.name} className="w-14 h-14 rounded-xl object-cover border-2 border-dark-400" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-dark-500 flex items-center justify-center text-xl font-bold text-blue-accent">
                {opponent.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-right">
              <p className="font-bold text-xl text-gray-200 group-hover:text-blue-accent transition-colors m-0">
                {opponent.name}
              </p>
              {opponent.country && <span className="text-lg">{countryFlag(opponent.country)}</span>}
            </div>
          </Link>
        </div>

        {/* Win bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gold-400">{player_wins} wins</span>
            <span className="text-sm font-bold text-blue-accent">{opponent_wins} wins</span>
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
        {/* Civ matchups */}
        <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-200 mb-4 m-0">Civilization Matchups</h2>
          {civ_matchups && civ_matchups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-400">
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">{player.name}</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">{opponent.name}</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium">Games</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {civ_matchups.slice(0, 20).map((m, i) => (
                    <tr key={i} className="border-b border-dark-500/50 hover:bg-dark-600/50">
                      <td className="py-2 px-2 text-gray-200">{m.player_civ_name || getCivName(m.player_civ_id)}</td>
                      <td className="py-2 px-2 text-gray-200">{m.opponent_civ_name || getCivName(m.opponent_civ_id)}</td>
                      <td className="py-2 px-2 text-right text-gray-400">{m.games}</td>
                      <td className="py-2 px-2 text-right">
                        <span className="text-gold-400">{m.player_wins}</span>
                        <span className="text-gray-600 mx-1">-</span>
                        <span className="text-blue-accent">{m.opponent_wins}</span>
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

        {/* Map stats */}
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
                      <td className="py-2 px-2 text-gray-200">{cleanMapName(m.map_name)}</td>
                      <td className="py-2 px-2 text-right text-gray-400">{m.games}</td>
                      <td className="py-2 px-2 text-right">
                        <span className="text-gold-400">{m.player_wins}</span>
                        <span className="text-gray-600 mx-1">-</span>
                        <span className="text-blue-accent">{m.opponent_wins}</span>
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

      {/* Recent matches between them */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 m-0">Recent Matches</h2>
        {recent_matches && recent_matches.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recent_matches.map((match) => {
              const isPlayerWin = match.won === true;
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
                        {match.civ_name || getCivName(match.civ_id)}
                      </span>
                      <span className="text-gray-600">vs</span>
                      <span className="font-medium text-blue-accent">
                        {match.opponent_civ_name || getCivName(match.opponent_civ_id)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{cleanMapName(match.map_name)}</span>
                      {match.duration && <span>{formatDuration(match.duration)}</span>}
                      {match.started && <span>{formatTimeAgo(match.started)}</span>}
                    </div>
                  </div>
                  {match.rating_change !== undefined && match.rating_change !== null && (
                    <span
                      className={`text-sm font-medium ${
                        match.rating_change > 0 ? 'text-win' : 'text-loss'
                      }`}
                    >
                      {match.rating_change > 0 ? `+${match.rating_change}` : match.rating_change}
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
