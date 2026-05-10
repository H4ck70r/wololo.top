import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { getMatchDetail } from '../lib/api';
import { getCivName, getCivIcon, formatDuration, countryFlag } from '../lib/constants';

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['matchDetail', matchId],
    queryFn: () => getMatchDetail(matchId!),
    enabled: !!matchId,
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

  if (error || !data?.match) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-300 mb-4">Match Not Found</h2>
        <p className="text-gray-500 mb-6">Could not find match with ID: {matchId}</p>
      </div>
    );
  }

  const match = data.match;
  const startedAt = match.started_at ? new Date(match.started_at) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Helmet>
        <title>Match {matchId} - wololo.top</title>
        <meta name="description" content={`${match.match_type || 'Match'} on ${match.map || 'Unknown'} — ${match.player_count} players, ${formatDuration(match.duration_seconds)}.`} />
      </Helmet>

      {/* Match header */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 m-0">Match Details</h1>
            <p className="text-xs text-gray-500 mt-1 m-0">Match ID: {match.match_id}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-300 m-0 font-medium">{match.match_type || 'Unknown'}</p>
            {startedAt && (
              <p className="text-xs text-gray-500 mt-1 m-0">
                {startedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {' at '}
                {startedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoBox label="Map" value={match.map || 'Unknown'} />
          <InfoBox label="Duration" value={formatDuration(match.duration_seconds)} />
          <InfoBox label="Players" value={`${match.player_count}`} />
          <InfoBox label="Mode" value={match.match_type || 'Unknown'} />
        </div>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {match.teams.map((team) => {
          const isWinner = team.result === 1;
          return (
            <div
              key={team.team_id}
              className={`bg-dark-700 border rounded-xl overflow-hidden ${
                isWinner ? 'border-win/30' : team.result === 0 ? 'border-loss/30' : 'border-dark-400'
              }`}
            >
              <div className={`px-5 py-3 border-b ${
                isWinner ? 'bg-win/10 border-win/20' : team.result === 0 ? 'bg-loss/10 border-loss/20' : 'bg-dark-600 border-dark-400'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${
                    isWinner ? 'text-win' : team.result === 0 ? 'text-loss' : 'text-gray-400'
                  }`}>
                    {isWinner ? 'VICTORY' : team.result === 0 ? 'DEFEAT' : 'IN PROGRESS'}
                  </span>
                  <span className="text-xs text-gray-500">Team {team.team_id}</span>
                </div>
              </div>
              <div className="divide-y divide-dark-500/50">
                {team.players.map((player) => {
                  const civIcon = getCivIcon(player.civilization_id);
                  return (
                    <div key={player.profile_id} className="px-5 py-3 flex items-center gap-3">
                      {player.avatar ? (
                        <img src={player.avatar} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 border border-dark-400" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-dark-500 flex items-center justify-center text-sm font-bold text-gray-400 shrink-0">
                          {(player.alias || '?').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/player/${player.profile_id}`}
                            className="text-sm font-medium text-gray-200 hover:text-gold-400 no-underline truncate"
                          >
                            {player.country && <span className="mr-1">{countryFlag(player.country)}</span>}
                            {player.alias || `Player ${player.profile_id}`}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {civIcon ? (
                            <img src={civIcon} alt="" className="w-4 h-4 rounded" />
                          ) : null}
                          <span className="text-xs text-gray-400">
                            {player.civilization || getCivName(player.civilization_id)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {player.new_rating != null && (
                          <p className="text-sm text-gray-300 font-medium m-0">{player.new_rating}</p>
                        )}
                        {player.rating_diff != null && (
                          <p className={`text-xs font-medium m-0 ${
                            player.rating_diff > 0 ? 'text-win' : player.rating_diff < 0 ? 'text-loss' : 'text-gray-500'
                          }`}>
                            {player.rating_diff > 0 ? `+${player.rating_diff}` : player.rating_diff}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-dark-600 rounded-lg p-3">
      <p className="text-xs text-gray-500 m-0">{label}</p>
      <p className="text-sm font-medium text-gray-200 mt-0.5 m-0">{value}</p>
    </div>
  );
}
