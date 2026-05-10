import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { getCivMeta, getMapMeta } from '../lib/api';
import { getCivName, cleanMapName, formatDuration } from '../lib/constants';

const MATCH_TYPE_OPTIONS = [
  { label: '1v1 RM', value: '6' },
  { label: 'Team RM', value: '7,8,9' },
  { label: '1v1 EW', value: '26' },
  { label: '1v1 DM', value: '2' },
];

const ELO_BRACKETS = [
  { label: 'All', min: 0, max: 9999 },
  { label: '< 1000', min: 0, max: 999 },
  { label: '1000-1200', min: 1000, max: 1200 },
  { label: '1200-1400', min: 1200, max: 1400 },
  { label: '1400-1600', min: 1400, max: 1600 },
  { label: '1600+', min: 1600, max: 9999 },
];

const DAYS_OPTIONS = [
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '180d', value: 180 },
  { label: 'All time', value: 3650 },
];

export default function CivMeta() {
  const [matchType, setMatchType] = useState('6');
  const [eloBracket, setEloBracket] = useState(0);
  const [days, setDays] = useState(90);
  const [tab, setTab] = useState<'civs' | 'maps'>('civs');

  const bracket = ELO_BRACKETS[eloBracket];

  const { data: civData, isLoading: loadingCivs } = useQuery({
    queryKey: ['civMeta', matchType, bracket.min, bracket.max, days],
    queryFn: () => getCivMeta({ match_type: matchType, min_rating: bracket.min, max_rating: bracket.max, days }),
    staleTime: 60_000,
  });

  const { data: mapData, isLoading: loadingMaps } = useQuery({
    queryKey: ['mapMeta', matchType, days],
    queryFn: () => getMapMeta({ match_type: matchType, days }),
    enabled: tab === 'maps',
    staleTime: 60_000,
  });

  const civs = civData?.civilizations || [];
  const avgWinRate = civs.length > 0 ? civs.reduce((s, c) => s + c.win_rate, 0) / civs.length : 50;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Helmet>
        <title>Civilization Meta - wololo.top</title>
        <meta name="description" content="AOE2 DE civilization win rates and tier list. See which civs dominate at every ELO bracket." />
        <link rel="canonical" href="https://wololo.top/stats" />
      </Helmet>

      <h1 className="text-3xl font-bold text-gray-100 mb-2 m-0">Civilization Meta</h1>
      <p className="text-sm text-gray-500 mb-6 m-0">
        Win rates across {civData ? civData.total_matches.toLocaleString() : '...'} matches
      </p>

      {/* Filters */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Match type */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5 m-0">Match Type</p>
            <div className="flex items-center gap-1 flex-wrap">
              {MATCH_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMatchType(opt.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    matchType === opt.value
                      ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {/* ELO bracket */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5 m-0">ELO Bracket</p>
            <div className="flex items-center gap-1 flex-wrap">
              {ELO_BRACKETS.map((b, i) => (
                <button
                  key={i}
                  onClick={() => setEloBracket(i)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    eloBracket === i
                      ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          {/* Time range */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5 m-0">Time Range</p>
            <div className="flex items-center gap-1 flex-wrap">
              {DAYS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDays(opt.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    days === opt.value
                      ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30'
                      : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6">
        <button
          onClick={() => setTab('civs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'civs' ? 'bg-dark-500 text-gold-400' : 'text-gray-400 hover:text-gray-200 hover:bg-dark-600'
          }`}
        >
          Civilizations
        </button>
        <button
          onClick={() => setTab('maps')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'maps' ? 'bg-dark-500 text-gold-400' : 'text-gray-400 hover:text-gray-200 hover:bg-dark-600'
          }`}
        >
          Maps
        </button>
      </div>

      {tab === 'civs' && (
        <>
          {loadingCivs ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : civs.length === 0 ? (
            <div className="bg-dark-700 border border-dark-400 rounded-xl p-12 text-center">
              <p className="text-gray-400 m-0">No data available for these filters.</p>
            </div>
          ) : (
            <div className="bg-dark-700 border border-dark-400 rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-100">
                <thead>
                  <tr className="border-b border-dark-400 bg-dark-800/50">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium w-8">#</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-medium">Civilization</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Games</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Win Rate</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-medium hidden sm:table-cell" style={{ width: '40%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {civs.map((civ, i) => {
                    const deviation = civ.win_rate - avgWinRate;
                    const barWidth = Math.min(Math.abs(deviation) * 4, 50);
                    const isAbove = deviation >= 0;
                    return (
                      <tr key={civ.civ_id} className="border-b border-dark-500/50 hover:bg-dark-600/50">
                        <td className="py-2.5 px-4 text-gray-500 text-xs">{i + 1}</td>
                        <td className="py-2.5 px-3 text-gray-200 font-medium">{getCivName(civ.civ_id)}</td>
                        <td className="py-2.5 px-3 text-right text-gray-400">{civ.games.toLocaleString()}</td>
                        <td className={`py-2.5 px-3 text-right font-medium ${
                          civ.win_rate >= 52 ? 'text-win' : civ.win_rate <= 48 ? 'text-loss' : 'text-gray-300'
                        }`}>
                          {civ.win_rate}%
                        </td>
                        <td className="py-2.5 px-3 hidden sm:table-cell">
                          <div className="flex items-center h-4">
                            <div className="w-1/2 flex justify-end">
                              {!isAbove && (
                                <div
                                  className="h-3 rounded-l bg-loss/40"
                                  style={{ width: `${barWidth}%` }}
                                />
                              )}
                            </div>
                            <div className="w-px h-4 bg-gray-600 shrink-0" />
                            <div className="w-1/2">
                              {isAbove && (
                                <div
                                  className="h-3 rounded-r bg-win/40"
                                  style={{ width: `${barWidth}%` }}
                                />
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Matchups grid */}
          {civData?.matchups && civData.matchups.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-200 mb-4 m-0">Top Matchups</h2>
              <div className="bg-dark-700 border border-dark-400 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-400 bg-dark-800/50">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Civ A</th>
                      <th className="text-left py-3 px-3 text-gray-400 font-medium">Civ B</th>
                      <th className="text-right py-3 px-3 text-gray-400 font-medium">Games</th>
                      <th className="text-right py-3 px-3 text-gray-400 font-medium">A Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {civData.matchups.slice(0, 50).map((m, i) => (
                      <tr key={i} className="border-b border-dark-500/50 hover:bg-dark-600/50">
                        <td className="py-2 px-4 text-gray-200">{getCivName(m.civ1)}</td>
                        <td className="py-2 px-3 text-gray-200">{getCivName(m.civ2)}</td>
                        <td className="py-2 px-3 text-right text-gray-400">{m.games.toLocaleString()}</td>
                        <td className={`py-2 px-3 text-right font-medium ${
                          m.civ1_win_rate >= 52 ? 'text-win' : m.civ1_win_rate <= 48 ? 'text-loss' : 'text-gray-300'
                        }`}>
                          {m.civ1_win_rate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'maps' && (
        <>
          {loadingMaps ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !mapData?.maps?.length ? (
            <div className="bg-dark-700 border border-dark-400 rounded-xl p-12 text-center">
              <p className="text-gray-400 m-0">No map data available for these filters.</p>
            </div>
          ) : (
            <div className="bg-dark-700 border border-dark-400 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-400 bg-dark-800/50">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium w-8">#</th>
                    <th className="text-left py-3 px-3 text-gray-400 font-medium">Map</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Games</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Avg Duration</th>
                    <th className="text-right py-3 px-3 text-gray-400 font-medium">Players</th>
                  </tr>
                </thead>
                <tbody>
                  {mapData.maps.map((m, i) => (
                    <tr key={i} className="border-b border-dark-500/50 hover:bg-dark-600/50">
                      <td className="py-2.5 px-4 text-gray-500 text-xs">{i + 1}</td>
                      <td className="py-2.5 px-3 text-gray-200 font-medium">{cleanMapName(m.map_name)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">{m.games.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">{m.avg_duration ? formatDuration(m.avg_duration) : '-'}</td>
                      <td className="py-2.5 px-3 text-right text-gray-400">{m.unique_players.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
