import { getCivName, cleanMapName, formatDuration } from '../lib/constants';
import type { MatchRecord } from '../lib/types';

interface MatchRowProps {
  match: MatchRecord;
}

export default function MatchRow({ match }: MatchRowProps) {
  const isWin = match.result === 1;
  const ratingChange =
    match.old_rating != null && match.new_rating != null
      ? match.new_rating - match.old_rating
      : null;

  const startedAt = match.started_at ? new Date(match.started_at) : null;
  const timeAgo = startedAt ? formatTimeAgoFromDate(startedAt) : null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
        isWin
          ? 'bg-win/5 border-win/20 hover:border-win/40'
          : 'bg-loss/5 border-loss/20 hover:border-loss/40'
      }`}
    >
      <div
        className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
          isWin ? 'bg-win/20 text-win' : 'bg-loss/20 text-loss'
        }`}
      >
        {isWin ? 'W' : 'L'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-200 text-sm">
            {getCivName(match.civilization_id)}
          </span>
          <span className="text-xs text-gray-500">
            {match.max_players > 2 ? `${match.max_players}p` : '1v1'}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>{cleanMapName(match.map_name)}</span>
          {match.duration_seconds && <span>{formatDuration(match.duration_seconds)}</span>}
          {timeAgo && <span>{timeAgo}</span>}
        </div>
      </div>

      <div className="shrink-0 text-right">
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
    </div>
  );
}

function formatTimeAgoFromDate(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
