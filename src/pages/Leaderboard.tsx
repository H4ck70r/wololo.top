import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getLeaderboard } from '../lib/api';
import { countryFlag } from '../lib/constants';

const PAGE_SIZE = 50;

const LEADERBOARD_TYPES = [
  { id: 3, label: 'Solo RM' },
  { id: 4, label: 'Team RM' },
] as const;

export default function Leaderboard() {
  const [leaderboardId, setLeaderboardId] = useState(3);
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', leaderboardId, page],
    queryFn: () =>
      getLeaderboard({
        leaderboard_id: leaderboardId,
        start: page * PAGE_SIZE + 1,
        count: PAGE_SIZE,
      }),
  });

  const entries = data?.entries || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 m-0">Leaderboard</h1>
          {total > 0 && (
            <p className="text-sm text-gray-500 mt-1 m-0">{total.toLocaleString()} players ranked</p>
          )}
        </div>

        {/* Toggle */}
        <div className="flex bg-dark-600 rounded-xl p-1 border border-dark-400">
          {LEADERBOARD_TYPES.map((lb) => (
            <button
              key={lb.id}
              onClick={() => {
                setLeaderboardId(lb.id);
                setPage(0);
              }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all border-none cursor-pointer ${
                leaderboardId === lb.id
                  ? 'bg-gold-500 text-dark-900 shadow-lg'
                  : 'text-gray-400 hover:text-gray-200 bg-transparent'
              }`}
            >
              {lb.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Failed to load leaderboard data.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-400 bg-dark-600/50">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium w-16">Rank</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Player</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Rating</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium hidden sm:table-cell">W / L</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Win Rate</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium hidden md:table-cell">Streak</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const rank = entry.rank || page * PAGE_SIZE + i + 1;
                  const wr = entry.win_rate || (entry.wins + entry.losses > 0 ? (entry.wins / (entry.wins + entry.losses)) * 100 : 0);
                  return (
                    <tr
                      key={entry.profile_id}
                      className="border-b border-dark-500/50 hover:bg-dark-600/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <span
                          className={`font-medium ${
                            rank <= 3 ? 'text-gold-400' : rank <= 10 ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          #{rank}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/player/${entry.profile_id}`}
                          className="flex items-center gap-2 no-underline group"
                        >
                          <span className="text-base">{countryFlag(entry.country)}</span>
                          <span className="font-medium text-gray-200 group-hover:text-gold-400 transition-colors truncate">
                            {entry.name}
                          </span>
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-gold-400">{entry.rating}</span>
                      </td>
                      <td className="py-3 px-4 text-right hidden sm:table-cell">
                        <span className="text-win">{entry.wins}</span>
                        <span className="text-gray-600 mx-1">/</span>
                        <span className="text-loss">{entry.losses}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-medium ${
                            wr >= 55 ? 'text-win' : wr >= 45 ? 'text-gray-300' : 'text-loss'
                          }`}
                        >
                          {wr.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right hidden md:table-cell">
                        {entry.streak !== undefined && (
                          <span
                            className={`font-medium ${
                              entry.streak > 0 ? 'text-win' : entry.streak < 0 ? 'text-loss' : 'text-gray-500'
                            }`}
                          >
                            {entry.streak > 0 ? `+${entry.streak}` : entry.streak}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-400">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-dark-500 text-gray-300 hover:bg-dark-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-none cursor-pointer"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-dark-500 text-gray-300 hover:bg-dark-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors border-none cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
