import { Link } from 'react-router-dom';
import { formatTimeAgo } from '../lib/constants';
import type { PlayerSearchResult } from '../lib/types';

interface PlayerCardProps {
  player: PlayerSearchResult;
}

export default function PlayerCard({ player }: PlayerCardProps) {
  return (
    <Link
      to={`/player/${player.profile_id}`}
      className="block bg-dark-700 border border-dark-400 rounded-xl p-4 hover:border-gold-500/50 hover:bg-dark-600 transition-all no-underline group"
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-200 truncate group-hover:text-gold-400 transition-colors m-0 text-base">
            {player.alias}
          </h3>
          <p className="text-sm text-gray-500 m-0">
            {player.lastmatchdate ? `Last match: ${formatTimeAgo(player.lastmatchdate)}` : `ID: ${player.profile_id}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-bold text-gold-400 m-0">{player.rating}</p>
          <p className="text-xs text-gray-500 m-0">{player.ladder_type === 'solo' ? 'Solo RM' : 'Team RM'}</p>
        </div>
      </div>
    </Link>
  );
}
