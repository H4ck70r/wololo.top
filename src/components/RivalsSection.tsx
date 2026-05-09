import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getOpponentAnalysis } from '../lib/api';
import type { OpponentAnalysisResponse, OpponentEntry } from '../lib/types';

interface RivalsSectionProps {
  profileId: string;
}

function HighlightCard({
  label,
  opponent,
  profileId,
  color,
  icon,
}: {
  label: string;
  opponent: OpponentEntry | null;
  profileId: string;
  color: 'gold' | 'red' | 'green';
  icon: string;
}) {
  if (!opponent) return null;

  const colorClasses = {
    gold: {
      border: 'border-gold-500/30',
      bg: 'bg-gold-500/5',
      accent: 'text-gold-400',
      badge: 'bg-gold-500/20 text-gold-400',
    },
    red: {
      border: 'border-red-500/30',
      bg: 'bg-red-500/5',
      accent: 'text-red-400',
      badge: 'bg-red-500/20 text-red-400',
    },
    green: {
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/5',
      accent: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-400',
    },
  };

  const c = colorClasses[color];

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${c.accent}`}>{label}</span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {opponent.avatar ? (
          <img
            src={opponent.avatar}
            alt={opponent.alias || 'Unknown'}
            className="w-10 h-10 rounded-lg object-cover border border-dark-400"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-dark-500 flex items-center justify-center text-sm font-bold text-gray-400">
            {(opponent.alias || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link
            to={`/player/${opponent.profile_id}`}
            className={`font-semibold ${c.accent} hover:underline text-sm no-underline truncate block`}
          >
            {opponent.alias || `Player ${opponent.profile_id}`}
          </Link>
          <p className="text-xs text-gray-500 m-0">{opponent.games} games played</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-xs text-gray-500 m-0">Record</p>
          <p className="text-sm font-medium m-0">
            <span className="text-win">{opponent.wins}W</span>
            {' / '}
            <span className="text-loss">{opponent.losses}L</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 m-0">Win Rate</p>
          <p className={`text-sm font-bold m-0 ${opponent.win_rate >= 50 ? 'text-win' : 'text-loss'}`}>
            {opponent.win_rate}%
          </p>
        </div>
        <div className="text-right">
          <Link
            to={`/h2h/${profileId}/${opponent.profile_id}`}
            className="inline-block mt-1 text-xs text-blue-accent hover:text-blue-400 transition-colors no-underline"
          >
            H2H
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default function RivalsSection({ profileId }: RivalsSectionProps) {
  const { data, isLoading } = useQuery<OpponentAnalysisResponse>({
    queryKey: ['opponentAnalysis', profileId],
    queryFn: () => getOpponentAnalysis(profileId),
    enabled: !!profileId,
  });

  if (isLoading) {
    return (
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-200 m-0 mb-4">Rivals</h2>
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || data.total_opponents === 0) {
    return null;
  }

  const { highlights, opponents } = data;

  return (
    <div>
      {/* Highlight cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <HighlightCard
          label="Most Played"
          opponent={highlights.most_played}
          profileId={profileId}
          color="gold"
          icon="&#9876;"
        />
        <HighlightCard
          label="Nemesis"
          opponent={highlights.nemesis}
          profileId={profileId}
          color="red"
          icon="&#128128;"
        />
        <HighlightCard
          label="Best Matchup"
          opponent={highlights.best_matchup}
          profileId={profileId}
          color="green"
          icon="&#127942;"
        />
      </div>

      {/* Opponents table */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200 m-0">Top Opponents</h2>
          <span className="text-xs text-gray-500">{data.total_opponents} unique opponents</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-400">
                <th className="text-left py-3 px-3 text-gray-400 font-medium">Player</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium">Games</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium">W/L</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium">Win Rate</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium">Last Played</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {opponents.map((opp) => {
                const wr = opp.win_rate;
                const barColor = wr >= 55 ? 'bg-win' : wr >= 45 ? 'bg-gold-500' : 'bg-loss';
                return (
                  <tr
                    key={opp.profile_id}
                    className="border-b border-dark-500/50 hover:bg-dark-600/50 transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <Link
                        to={`/player/${opp.profile_id}`}
                        className="font-medium text-blue-accent hover:text-blue-400 transition-colors no-underline"
                      >
                        {opp.alias || `Player ${opp.profile_id}`}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-300 font-medium">{opp.games}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-win">{opp.wins}</span>
                      <span className="text-gray-600"> / </span>
                      <span className="text-loss">{opp.losses}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-dark-400 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} rounded-full`}
                            style={{ width: `${Math.min(wr, 100)}%` }}
                          />
                        </div>
                        <span className={`font-medium ${wr >= 55 ? 'text-win' : wr >= 45 ? 'text-gold-400' : 'text-loss'}`}>
                          {wr.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-500 text-xs">
                      {formatTimeAgo(opp.last_played)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/h2h/${profileId}/${opp.profile_id}`}
                        className="text-xs text-gray-500 hover:text-blue-accent transition-colors no-underline"
                      >
                        H2H
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
