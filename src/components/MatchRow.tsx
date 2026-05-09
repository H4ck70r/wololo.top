import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getCivName, getCivIcon, formatDuration } from '../lib/constants';
import type { MatchRecord, MatchPlayer } from '../lib/types';

interface MatchRowProps {
  match: MatchRecord;
  profileId?: string | number;
}

function CivBadge({ civId, size = 'md' }: { civId: number | null | undefined; size?: 'sm' | 'md' }) {
  const icon = getCivIcon(civId ?? undefined);
  const px = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';

  if (icon) {
    return (
      <img
        src={icon}
        alt={getCivName(civId)}
        title={getCivName(civId)}
        className={`${px} rounded object-cover`}
      />
    );
  }

  return (
    <div className={`${px} rounded bg-dark-500 flex items-center justify-center text-[10px] font-bold text-gray-400`} title={getCivName(civId)}>
      {getCivName(civId).charAt(0)}
    </div>
  );
}

function PlayerLine({ player, isCurrentPlayer }: { player: MatchPlayer; isCurrentPlayer: boolean }) {
  const ratingStr = player.new_rating != null ? `${player.new_rating}` : '';
  const diffStr =
    player.rating_diff != null
      ? player.rating_diff > 0
        ? `+${player.rating_diff}`
        : `${player.rating_diff}`
      : '';

  return (
    <div className={`flex items-center gap-2 py-0.5 ${isCurrentPlayer ? 'font-medium' : ''}`}>
      <CivBadge civId={player.civilization_id} size="sm" />
      <Link
        to={`/player/${player.profile_id}`}
        className={`text-xs truncate max-w-[140px] no-underline transition-colors ${
          isCurrentPlayer ? 'text-gold-400 hover:text-gold-300' : 'text-gray-300 hover:text-gray-100'
        }`}
      >
        {player.alias || `Player ${player.profile_id}`}
      </Link>
      {ratingStr && (
        <span className="text-[11px] text-gray-500 ml-auto tabular-nums">{ratingStr}</span>
      )}
      {diffStr && (
        <span
          className={`text-[10px] tabular-nums ${
            player.rating_diff! > 0 ? 'text-win' : player.rating_diff! < 0 ? 'text-loss' : 'text-gray-500'
          }`}
        >
          {diffStr}
        </span>
      )}
    </div>
  );
}

export default function MatchRow({ match, profileId }: MatchRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isWin = match.result === 1;
  const ratingChange =
    match.old_rating != null && match.new_rating != null
      ? match.new_rating - match.old_rating
      : null;

  const startedAt = match.started_at ? new Date(match.started_at) : null;
  const timeAgo = startedAt ? formatTimeAgoFromDate(startedAt) : null;

  const pid = profileId ? Number(profileId) : null;
  const hasTeams = match.teams && match.teams.length > 0;
  const totalPlayers = hasTeams ? match.teams.reduce((sum, t) => sum + t.players.length, 0) : 0;
  const isTeamGame = totalPlayers > 2;

  const myTeamId = match.team_id;
  const myTeam = hasTeams ? match.teams.find((t) => t.team_id === myTeamId) : null;
  const enemyTeams = hasTeams ? match.teams.filter((t) => t.team_id !== myTeamId) : [];

  return (
    <div
      className={`rounded-lg border transition-colors ${
        isWin
          ? 'bg-win/5 border-win/20 hover:border-win/40'
          : 'bg-loss/5 border-loss/20 hover:border-loss/40'
      }`}
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 select-none ${isTeamGame ? 'cursor-pointer' : ''}`}
        onClick={() => isTeamGame && setExpanded(!expanded)}
      >
        {/* W/L badge */}
        <div
          className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
            isWin ? 'bg-win/20 text-win' : 'bg-loss/20 text-loss'
          }`}
        >
          {isWin ? 'W' : 'L'}
        </div>

        {/* Player civ */}
        <CivBadge civId={match.civilization_id} />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gold-400 text-sm">
              {match.civilization || getCivName(match.civilization_id)}
            </span>

            {!isTeamGame && enemyTeams.length > 0 && enemyTeams[0].players.length > 0 ? (
              <>
                <span className="text-xs text-gray-600">vs</span>
                <div className="flex items-center gap-1.5">
                  <CivBadge civId={enemyTeams[0].players[0].civilization_id} size="sm" />
                  <Link
                    to={`/player/${enemyTeams[0].players[0].profile_id}`}
                    className="font-medium text-blue-400 text-sm hover:text-blue-300 transition-colors no-underline"
                  >
                    {enemyTeams[0].players[0].alias || 'Unknown'}
                  </Link>
                </div>
              </>
            ) : isTeamGame ? (
              <span className="text-xs text-gray-500 bg-dark-500 px-1.5 py-0.5 rounded">
                {match.match_type || `${Math.ceil(totalPlayers / 2)}v${Math.floor(totalPlayers / 2)}`}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>{match.map || match.map_name || 'Unknown'}</span>
            {match.duration_seconds != null && match.duration_seconds > 0 && (
              <span>{formatDuration(match.duration_seconds)}</span>
            )}
            {timeAgo && <span>{timeAgo}</span>}
          </div>
        </div>

        {/* Rating + expand indicator */}
        <div className="shrink-0 text-right flex items-center gap-2">
          <div>
            {match.new_rating != null && (
              <p className="text-sm text-gray-300 font-medium m-0">{match.new_rating}</p>
            )}
            {ratingChange !== null && (
              <p
                className={`text-xs font-medium m-0 ${
                  ratingChange > 0 ? 'text-win' : ratingChange < 0 ? 'text-loss' : 'text-gray-500'
                }`}
              >
                {ratingChange > 0 ? `+${ratingChange}` : ratingChange}
              </p>
            )}
          </div>
          {isTeamGame && (
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Expanded: show all players by team */}
      {expanded && isTeamGame && hasTeams && (
        <div className="px-4 pb-3 pt-0 border-t border-dark-400/50">
          <div className={`grid gap-4 mt-3 ${enemyTeams.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* My team */}
            {myTeam && (
              <div>
                <p className={`text-[10px] uppercase tracking-wider mb-1 m-0 ${isWin ? 'text-win/70' : 'text-loss/70'}`}>
                  {isWin ? 'Winners' : 'Losers'} &middot; Team {myTeam.team_id}
                </p>
                {myTeam.players.map((p) => (
                  <PlayerLine key={p.profile_id} player={p} isCurrentPlayer={p.profile_id === pid} />
                ))}
              </div>
            )}

            {/* Enemy teams */}
            {enemyTeams.map((team) => (
              <div key={team.team_id}>
                <p className={`text-[10px] uppercase tracking-wider mb-1 m-0 ${!isWin ? 'text-win/70' : 'text-loss/70'}`}>
                  {!isWin ? 'Winners' : 'Losers'} &middot; Team {team.team_id}
                </p>
                {team.players.map((p) => (
                  <PlayerLine key={p.profile_id} player={p} isCurrentPlayer={false} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgoFromDate(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(!sameYear && { year: 'numeric' }) });
}
