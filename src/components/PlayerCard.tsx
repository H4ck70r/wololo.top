import { Link } from 'react-router-dom';
import { countryFlag, formatTimeAgo } from '../lib/constants';
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
        <span className="text-2xl">{countryFlag(player.country)}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-200 truncate group-hover:text-gold-400 transition-colors m-0 text-base">
            {player.name}
          </h3>
          <p className="text-sm text-gray-500 m-0">
            {player.last_match_time ? `Last match: ${formatTimeAgo(player.last_match_time)}` : `ID: ${player.profile_id}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          {player.rm_rating ? (
            <div>
              <p className="text-lg font-bold text-gold-400 m-0">{player.rm_rating}</p>
              <p className="text-xs text-gray-500 m-0">Solo RM</p>
            </div>
          ) : player.team_rm_rating ? (
            <div>
              <p className="text-lg font-bold text-blue-accent m-0">{player.team_rm_rating}</p>
              <p className="text-xs text-gray-500 m-0">Team RM</p>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
