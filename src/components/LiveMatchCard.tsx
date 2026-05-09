import { Link } from 'react-router-dom';
import { cleanMapName, formatDuration } from '../lib/constants';
import type { LiveMatch, LiveMatchPlayer } from '../lib/types';

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      Live
    </span>
  );
}

function MatchTypeBadge({ matchType }: { matchType: string | null }) {
  if (!matchType) return null;
  return (
    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-dark-500 text-gray-400 border border-dark-400">
      {matchType}
    </span>
  );
}

function PlayerRow({ player }: { player: LiveMatchPlayer }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Link
        to={`/player/${player.profile_id}`}
        className="text-sm text-gray-200 hover:text-gold-400 transition-colors no-underline truncate max-w-[180px] font-medium"
      >
        {player.alias || `Player ${player.profile_id}`}
      </Link>
      {player.rating != null && (
        <span className="text-xs text-gray-500 tabular-nums ml-auto">{player.rating}</span>
      )}
    </div>
  );
}

interface LiveMatchCardProps {
  match: LiveMatch;
}

export default function LiveMatchCard({ match }: LiveMatchCardProps) {
  const mapDisplay = match.map || cleanMapName(match.map_name);
  const duration = match.duration_seconds != null && match.duration_seconds > 0
    ? formatDuration(match.duration_seconds)
    : null;

  // Split players into two sides for team display
  const half = Math.ceil(match.players.length / 2);
  const side1 = match.players.slice(0, half);
  const side2 = match.players.slice(half);

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-4 hover:border-dark-300 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LiveBadge />
          <MatchTypeBadge matchType={match.match_type} />
        </div>
        {duration && (
          <span className="text-xs text-gray-500 tabular-nums">{duration}</span>
        )}
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 gap-4">
        {/* Side 1 */}
        <div className="space-y-0.5">
          {side1.map((player) => (
            <PlayerRow key={player.profile_id} player={player} />
          ))}
        </div>

        {/* VS divider + Side 2 */}
        <div className="space-y-0.5 border-l border-dark-400 pl-4">
          {side2.map((player) => (
            <PlayerRow key={player.profile_id} player={player} />
          ))}
        </div>
      </div>

      {/* Footer: map + player count */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dark-400/50">
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-xs text-gray-400">{mapDisplay}</span>
        </div>
        <span className="text-xs text-gray-600">
          {match.player_count} player{match.player_count !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
