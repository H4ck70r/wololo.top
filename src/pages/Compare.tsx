import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { getPlayer, getPlayerStats, getHeadToHead } from '../lib/api';
import { getCivName, countryFlag, cleanMapName, formatDuration } from '../lib/constants';
import PlayerSearchInput from '../components/PlayerSearchInput';
import type { PlayerSearchResult } from '../lib/types';

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const p1Id = searchParams.get('p1');
  const p2Id = searchParams.get('p2');

  const [selectedP1, setSelectedP1] = useState<PlayerSearchResult | null>(null);
  const [selectedP2, setSelectedP2] = useState<PlayerSearchResult | null>(null);

  const { data: p1Data } = useQuery({
    queryKey: ['player', p1Id],
    queryFn: () => getPlayer(p1Id!),
    enabled: !!p1Id,
  });
  const { data: p2Data } = useQuery({
    queryKey: ['player', p2Id],
    queryFn: () => getPlayer(p2Id!),
    enabled: !!p2Id,
  });
  const { data: p1Stats } = useQuery({
    queryKey: ['playerStats', p1Id],
    queryFn: () => getPlayerStats(p1Id!),
    enabled: !!p1Id,
  });
  const { data: p2Stats } = useQuery({
    queryKey: ['playerStats', p2Id],
    queryFn: () => getPlayerStats(p2Id!),
    enabled: !!p2Id,
  });
  const { data: h2h } = useQuery({
    queryKey: ['h2h', p1Id, p2Id],
    queryFn: () => getHeadToHead(p1Id!, p2Id!),
    enabled: !!p1Id && !!p2Id,
  });

  const p1 = p1Data?.player;
  const p2 = p2Data?.player;

  const handleSelectP1 = (player: PlayerSearchResult) => {
    setSelectedP1(player);
    const params = new URLSearchParams(searchParams);
    params.set('p1', String(player.profile_id));
    setSearchParams(params);
  };
  const handleSelectP2 = (player: PlayerSearchResult) => {
    setSelectedP2(player);
    const params = new URLSearchParams(searchParams);
    params.set('p2', String(player.profile_id));
    setSearchParams(params);
  };

  const clearPlayer = (side: 'p1' | 'p2') => {
    if (side === 'p1') setSelectedP1(null);
    else setSelectedP2(null);
    const params = new URLSearchParams(searchParams);
    params.delete(side);
    setSearchParams(params);
  };

  const hasBoth = !!p1 && !!p2;

  const p1Solo = p1?.ladders?.find(l => l.type === 'solo');
  const p2Solo = p2?.ladders?.find(l => l.type === 'solo');
  const p1Team = p1?.ladders?.find(l => l.type === 'team');
  const p2Team = p2?.ladders?.find(l => l.type === 'team');

  const p1Name = p1?.alias || selectedP1?.alias || 'Player 1';
  const p2Name = p2?.alias || selectedP2?.alias || 'Player 2';

  const pageTitle = hasBoth
    ? `${p1Name} vs ${p2Name} - Compare - wololo.top`
    : 'Compare Players - wololo.top';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={hasBoth ? `Compare ${p1Name} and ${p2Name} side by side: ratings, win rates, civilization stats, and head-to-head record.` : 'Compare any two AOE2 DE players side by side. Ratings, win rates, civ preferences, and head-to-head records.'} />
        <link rel="canonical" href={hasBoth ? `https://wololo.top/compare?p1=${p1Id}&p2=${p2Id}` : 'https://wololo.top/compare'} />
      </Helmet>

      <h1 className="text-3xl font-bold text-gray-100 mb-6 m-0">Compare Players</h1>

      {/* Player selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <PlayerSelector
          player={p1}
          searchResult={selectedP1}
          label="Player 1"
          color="gold"
          onSelect={handleSelectP1}
          onClear={() => clearPlayer('p1')}
          excludeProfileId={p2 ? p2.profile_id : undefined}
        />
        <PlayerSelector
          player={p2}
          searchResult={selectedP2}
          label="Player 2"
          color="blue"
          onSelect={handleSelectP2}
          onClear={() => clearPlayer('p2')}
          excludeProfileId={p1 ? p1.profile_id : undefined}
        />
      </div>

      {!hasBoth && (
        <div className="bg-dark-700 border border-dark-400 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 text-dark-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-400 font-medium m-0">Select two players to compare</p>
          <p className="text-sm text-gray-500 mt-1 m-0">Search by player name, profile ID, or Steam ID.</p>
        </div>
      )}

      {hasBoth && (
        <>
          {/* Ratings comparison */}
          <div className="bg-dark-700 border border-dark-400 rounded-xl p-5 mb-6">
            <h2 className="text-lg font-semibold text-gray-200 mb-4 m-0">Ratings</h2>
            <div className="space-y-3">
              <CompareRow
                label="Solo RM Rating"
                v1={p1Solo?.rating}
                v2={p2Solo?.rating}
                format="number"
              />
              <CompareRow
                label="Solo RM Rank"
                v1={p1Solo?.rank}
                v2={p2Solo?.rank}
                format="rank"
                lowerIsBetter
              />
              <CompareRow
                label="Team RM Rating"
                v1={p1Team?.rating}
                v2={p2Team?.rating}
                format="number"
              />
              <CompareRow
                label="Team RM Rank"
                v1={p1Team?.rank}
                v2={p2Team?.rank}
                format="rank"
                lowerIsBetter
              />
              <CompareRow
                label="Overall Win Rate"
                v1={p1 ? parseFloat(p1.winrate || '0') : undefined}
                v2={p2 ? parseFloat(p2.winrate || '0') : undefined}
                format="percent"
              />
              <CompareRow
                label="Total Games"
                v1={p1 ? (p1.wins + p1.losses) : undefined}
                v2={p2 ? (p2.wins + p2.losses) : undefined}
                format="number"
              />
              <CompareRow
                label="Wins"
                v1={p1?.wins}
                v2={p2?.wins}
                format="number"
              />
              <CompareRow
                label="Losses"
                v1={p1?.losses}
                v2={p2?.losses}
                format="number"
                lowerIsBetter
              />
            </div>
          </div>

          {/* Head-to-Head */}
          {h2h && h2h.total_games > 0 && (
            <div className="bg-dark-700 border border-dark-400 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-200 m-0">Head to Head</h2>
                <Link
                  to={`/h2h/${p1Id}/${p2Id}`}
                  className="text-xs text-gold-400 hover:text-gold-300 no-underline"
                >
                  Full H2H details &rarr;
                </Link>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="text-right flex-1">
                  <p className="text-2xl font-bold text-gold-400 m-0">{h2h.wins}</p>
                  <p className="text-xs text-gray-500 m-0">{p1Name}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 m-0">{h2h.total_games} games</p>
                </div>
                <div className="text-left flex-1">
                  <p className="text-2xl font-bold text-blue-accent m-0">{h2h.losses}</p>
                  <p className="text-xs text-gray-500 m-0">{p2Name}</p>
                </div>
              </div>

              <div className="w-full h-3 bg-dark-400 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-gold-500 to-gold-400"
                  style={{ width: `${h2h.total_games > 0 ? (h2h.wins / h2h.total_games) * 100 : 50}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-blue-accent to-blue-500"
                  style={{ width: `${h2h.total_games > 0 ? (h2h.losses / h2h.total_games) * 100 : 50}%` }}
                />
              </div>

              {h2h.recent_matches && h2h.recent_matches.length > 0 && (
                <div className="mt-4 pt-4 border-t border-dark-400">
                  <p className="text-xs text-gray-500 mb-2 m-0">Last {Math.min(5, h2h.recent_matches.length)} matches</p>
                  <div className="flex flex-col gap-1.5">
                    {h2h.recent_matches.slice(0, 5).map((m) => {
                      const isP1Win = m.player_result === 1;
                      const startedAt = m.started_at ? new Date(m.started_at) : null;
                      return (
                        <div key={m.match_id} className="flex items-center gap-2 text-xs">
                          <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                            isP1Win ? 'bg-win/20 text-win' : 'bg-loss/20 text-loss'
                          }`}>
                            {isP1Win ? 'W' : 'L'}
                          </span>
                          <span className="text-gold-400">{m.player_civ_name || getCivName(m.player_civ)}</span>
                          <span className="text-gray-600">vs</span>
                          <span className="text-blue-accent">{m.opponent_civ_name || getCivName(m.opponent_civ)}</span>
                          <span className="text-gray-600 ml-auto">{m.map || cleanMapName(m.map_name)}</span>
                          {m.duration_seconds && <span className="text-gray-600">{formatDuration(m.duration_seconds)}</span>}
                          {startedAt && <span className="text-gray-600">{startedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Civ Stats Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <CivColumn name={p1Name} stats={p1Stats?.civ_stats || []} color="gold" />
            <CivColumn name={p2Name} stats={p2Stats?.civ_stats || []} color="blue" />
          </div>

          {/* Map Stats Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <MapColumn name={p1Name} stats={p1Stats?.map_stats || []} color="gold" />
            <MapColumn name={p2Name} stats={p2Stats?.map_stats || []} color="blue" />
          </div>
        </>
      )}
    </div>
  );
}

function PlayerSelector({
  player,
  label,
  color,
  onSelect,
  onClear,
  excludeProfileId,
}: {
  player: any;
  searchResult: PlayerSearchResult | null;
  label: string;
  color: 'gold' | 'blue';
  onSelect: (p: PlayerSearchResult) => void;
  onClear: () => void;
  excludeProfileId?: number;
}) {
  const borderColor = color === 'gold' ? 'border-gold-500/30' : 'border-blue-accent/30';
  const textColor = color === 'gold' ? 'text-gold-400' : 'text-blue-accent';

  if (player) {
    const soloLadder = player.ladders?.find((l: any) => l.type === 'solo');
    return (
      <div className={`bg-dark-700 border ${borderColor} rounded-xl p-4`}>
        <div className="flex items-center gap-3">
          {player.avatar ? (
            <img src={player.avatar} alt={player.alias} className="w-12 h-12 rounded-lg object-cover border border-dark-400" />
          ) : (
            <div className={`w-12 h-12 rounded-lg bg-dark-500 flex items-center justify-center text-lg font-bold ${textColor}`}>
              {player.alias.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link to={`/player/${player.profile_id}`} className={`font-bold text-lg ${textColor} no-underline hover:underline m-0 block truncate`}>
              {player.country && <span className="mr-1.5">{countryFlag(player.country)}</span>}
              {player.alias}
            </Link>
            <p className="text-xs text-gray-500 m-0">
              {soloLadder ? `${soloLadder.rating} Solo RM` : 'Unranked'}
              {' · '}
              {player.wins + player.losses} games
            </p>
          </div>
          <button onClick={onClear} className="text-gray-500 hover:text-gray-300 p-1 bg-transparent border-none cursor-pointer" title="Remove">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-4">
      <p className="text-sm text-gray-400 mb-2 m-0">{label}</p>
      <PlayerSearchInput
        onSelect={onSelect}
        placeholder={`Search ${label.toLowerCase()}...`}
        excludeProfileId={excludeProfileId}
      />
    </div>
  );
}

function CompareRow({
  label,
  v1,
  v2,
  format,
  lowerIsBetter = false,
}: {
  label: string;
  v1: number | undefined;
  v2: number | undefined;
  format: 'number' | 'percent' | 'rank';
  lowerIsBetter?: boolean;
}) {
  const fmt = (v: number | undefined) => {
    if (v == null) return '-';
    if (format === 'percent') return `${v.toFixed(1)}%`;
    if (format === 'rank') return `#${v.toLocaleString()}`;
    return v.toLocaleString();
  };

  let p1Better = false;
  let p2Better = false;
  if (v1 != null && v2 != null && v1 !== v2) {
    if (lowerIsBetter) {
      p1Better = v1 < v2;
      p2Better = v2 < v1;
    } else {
      p1Better = v1 > v2;
      p2Better = v2 > v1;
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 text-right text-sm font-medium ${p1Better ? 'text-win' : 'text-gray-300'}`}>
        {fmt(v1)}
      </div>
      <div className="w-32 text-center text-xs text-gray-500 shrink-0">{label}</div>
      <div className={`flex-1 text-left text-sm font-medium ${p2Better ? 'text-win' : 'text-gray-300'}`}>
        {fmt(v2)}
      </div>
    </div>
  );
}

function CivColumn({ name, stats, color }: { name: string; stats: any[]; color: 'gold' | 'blue' }) {
  const textColor = color === 'gold' ? 'text-gold-400' : 'text-blue-accent';
  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
      <h2 className="text-lg font-semibold text-gray-200 mb-3 m-0">
        <span className={textColor}>{name}</span> — Top Civs
      </h2>
      {stats.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-400">
              <th className="text-left py-2 px-1 text-gray-400 font-medium">Civilization</th>
              <th className="text-right py-2 px-1 text-gray-400 font-medium">Games</th>
              <th className="text-right py-2 px-1 text-gray-400 font-medium">Win %</th>
            </tr>
          </thead>
          <tbody>
            {stats.slice(0, 10).map((c, i) => (
              <tr key={i} className="border-b border-dark-500/50">
                <td className="py-1.5 px-1 text-gray-200">{c.civilization || getCivName(c.civ_id)}</td>
                <td className="py-1.5 px-1 text-right text-gray-400">{c.games}</td>
                <td className="py-1.5 px-1 text-right text-gray-300">{c.win_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 text-sm">No civ data available.</p>
      )}
    </div>
  );
}

function MapColumn({ name, stats, color }: { name: string; stats: any[]; color: 'gold' | 'blue' }) {
  const textColor = color === 'gold' ? 'text-gold-400' : 'text-blue-accent';
  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
      <h2 className="text-lg font-semibold text-gray-200 mb-3 m-0">
        <span className={textColor}>{name}</span> — Top Maps
      </h2>
      {stats.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-400">
              <th className="text-left py-2 px-1 text-gray-400 font-medium">Map</th>
              <th className="text-right py-2 px-1 text-gray-400 font-medium">Games</th>
              <th className="text-right py-2 px-1 text-gray-400 font-medium">Win %</th>
            </tr>
          </thead>
          <tbody>
            {stats.slice(0, 10).map((m, i) => (
              <tr key={i} className="border-b border-dark-500/50">
                <td className="py-1.5 px-1 text-gray-200">{m.map || cleanMapName(m.map_name)}</td>
                <td className="py-1.5 px-1 text-right text-gray-400">{m.games}</td>
                <td className="py-1.5 px-1 text-right text-gray-300">{m.win_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 text-sm">No map data available.</p>
      )}
    </div>
  );
}
