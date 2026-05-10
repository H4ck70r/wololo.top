import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { countryFlag } from '../lib/constants';
import type { LeaderboardPlayer } from '../lib/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_KEY = import.meta.env.VITE_API_KEY || '';

interface ClanResponse {
  status: string;
  clan_name: string;
  total: number;
  players: (LeaderboardPlayer & { ladder_type?: string })[];
}

async function getClanPlayers(clanName: string): Promise<ClanResponse> {
  const url = new URL(`${BASE_URL || window.location.origin}/api/players/clan/${encodeURIComponent(clanName)}`);
  url.searchParams.set('ladder', 'all');
  url.searchParams.set('limit', '200');
  const res = await fetch(url.toString(), { headers: { 'X-API-Key': API_KEY } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default function ClanProfile() {
  const { clanName } = useParams<{ clanName: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['clan', clanName],
    queryFn: () => getClanPlayers(clanName!),
    enabled: !!clanName,
  });

  const players = data?.players || [];
  const totalMembers = data?.total ?? players.length;

  const avgRating = players.length > 0
    ? Math.round(players.filter(p => p.rating > 0).reduce((s, p) => s + p.rating, 0) / Math.max(1, players.filter(p => p.rating > 0).length))
    : 0;
  const totalWins = players.reduce((s, p) => s + (p.wins || 0), 0);
  const totalLosses = players.reduce((s, p) => s + (p.losses || 0), 0);
  const countries = [...new Set(players.map(p => p.country).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data || players.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-300 mb-4">Clan Not Found</h2>
        <p className="text-gray-500 mb-6">No players found with clan tag "{clanName}".</p>
        <Link to="/leaderboard" className="text-gold-400 hover:text-gold-300 no-underline">
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Helmet>
        <title>[{clanName}] Clan - wololo.top</title>
        <meta name="description" content={`${clanName} clan profile: ${totalMembers} members, avg rating ${avgRating}. View all players and stats.`} />
        <link rel="canonical" href={`https://wololo.top/clan/${encodeURIComponent(clanName!)}`} />
      </Helmet>

      {/* Clan header */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-xl bg-dark-500 flex items-center justify-center text-2xl font-black text-gold-400">
            {clanName!.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 m-0">[{clanName}]</h1>
            <p className="text-sm text-gray-500 mt-1 m-0">
              {totalMembers} member{totalMembers !== 1 ? 's' : ''}
              {countries.length > 0 && ` · ${countries.length} countr${countries.length !== 1 ? 'ies' : 'y'}`}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <StatBox label="Members" value={totalMembers.toString()} />
          <StatBox label="Avg Rating" value={avgRating > 0 ? avgRating.toString() : '-'} />
          <StatBox label="Total Wins" value={totalWins.toLocaleString()} />
          <StatBox label="Total Losses" value={totalLosses.toLocaleString()} />
        </div>
      </div>

      {/* Members list */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-400">
          <h2 className="text-lg font-semibold text-gray-200 m-0">Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-400 bg-dark-800/50">
                <th className="text-left py-3 px-4 text-gray-400 font-medium w-8">#</th>
                <th className="text-left py-3 px-3 text-gray-400 font-medium">Player</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium">Rating</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium hidden sm:table-cell">Rank</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium hidden sm:table-cell">W/L</th>
                <th className="text-right py-3 px-3 text-gray-400 font-medium">Win %</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => {
                const wr = (p.wins + p.losses) > 0
                  ? ((p.wins / (p.wins + p.losses)) * 100).toFixed(1)
                  : '-';
                return (
                  <tr key={p.profile_id} className="border-b border-dark-500/50 hover:bg-dark-600/50">
                    <td className="py-2.5 px-4 text-gray-500 text-xs">{i + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {p.avatar ? (
                          <img src={p.avatar} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded bg-dark-500 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0">
                            {(p.alias || p.name || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <Link
                          to={`/player/${p.profile_id}`}
                          className="text-gray-200 hover:text-gold-400 no-underline font-medium truncate"
                        >
                          {p.country && <span className="mr-1">{countryFlag(p.country)}</span>}
                          {p.alias || p.name || `Player ${p.profile_id}`}
                        </Link>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gold-400 font-medium">{p.rating || '-'}</td>
                    <td className="py-2.5 px-3 text-right text-gray-400 hidden sm:table-cell">
                      {p.rank ? `#${p.rank.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-400 hidden sm:table-cell">
                      <span className="text-win">{p.wins}</span>
                      <span className="text-gray-600 mx-0.5">/</span>
                      <span className="text-loss">{p.losses}</span>
                    </td>
                    <td className={`py-2.5 px-3 text-right font-medium ${
                      Number(wr) >= 52 ? 'text-win' : Number(wr) <= 48 ? 'text-loss' : 'text-gray-300'
                    }`}>
                      {wr !== '-' ? `${wr}%` : '-'}
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

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-dark-600 rounded-lg p-3 text-center">
      <p className="text-xl font-bold text-gold-400 m-0">{value}</p>
      <p className="text-xs text-gray-500 mt-1 m-0">{label}</p>
    </div>
  );
}
