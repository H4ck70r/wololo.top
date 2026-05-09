import { Link } from 'react-router-dom';
import { getCivName, cleanMapName, formatDuration, formatTimeAgo } from '../lib/constants';
import type { Match } from '../lib/types';

interface MatchRowProps {
  match: Match;
  currentProfileId?: number | string;
}

export default function MatchRow({ match, currentProfileId }: MatchRowProps) {
  const isWin = match.won === true;
  const ratingChange = match.rating_change;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
        isWin
          ? 'bg-win/5 border-win/20 hover:border-win/40'
          : 'bg-loss/5 border-loss/20 hover:border-loss/40'
      }`}
    >
      {/* Result badge */}
      <div
        className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
          isWin ? 'bg-win/20 text-win' : 'bg-loss/20 text-loss'
        }`}
      >
        {isWin ? 'W' : 'L'}
      </div>

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-200 text-sm">
            {match.civ_name || getCivName(match.civ_id)}
          </span>
          <span className="text-gray-600">vs</span>
          {match.opponent_profile_id ? (
            <Link
              to={`/player/${match.opponent_profile_id}`}
              className="text-sm text-blue-accent hover:text-blue-400 no-underline"
              onClick={(e) => e.stopPropagation()}
            >
              {match.opponent_name || 'Unknown'}
            </Link>
          ) : (
            <span className="text-sm text-gray-400">
              {match.opponent_name || 'Unknown'}
            </span>
          )}
          {match.opponent_civ_id !== undefined && (
            <span className="text-xs text-gray-500">
              ({match.opponent_civ_name || getCivName(match.opponent_civ_id)})
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>{cleanMapName(match.map_name)}</span>
          {match.duration && <span>{formatDuration(match.duration)}</span>}
          {match.started && <span>{formatTimeAgo(match.started)}</span>}
        </div>
      </div>

      {/* Rating info */}
      <div className="shrink-0 text-right">
        {match.rating && (
          <p className="text-sm text-gray-300 font-medium m-0">{match.rating}</p>
        )}
        {ratingChange !== undefined && ratingChange !== null && (
          <p
            className={`text-xs font-medium m-0 ${
              ratingChange > 0 ? 'text-win' : ratingChange < 0 ? 'text-loss' : 'text-gray-500'
            }`}
          >
            {ratingChange > 0 ? `+${ratingChange}` : ratingChange}
          </p>
        )}
      </div>

      {/* H2H link */}
      {match.opponent_profile_id && currentProfileId && (
        <Link
          to={`/h2h/${currentProfileId}/${match.opponent_profile_id}`}
          className="shrink-0 text-xs text-gray-500 hover:text-gold-400 no-underline transition-colors px-2 py-1 rounded hover:bg-dark-500"
          title="Head to Head"
        >
          H2H
        </Link>
      )}
    </div>
  );
}
