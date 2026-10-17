import { useT } from '../lib/i18n';
import LevelBenchmarks from '../components/LevelBenchmarks';
import { useSession } from '../lib/session';
import { getPlayer } from '../lib/api';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { getCivMeta, getCivMatchups, getMapMeta } from '../lib/api';
import { getCivName, getCivIcon, cleanMapName, formatDuration } from '../lib/constants';

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
  { label: 'all', value: 3650 },
];

export default function CivMeta() {
  const { t } = useT();
  const [matchType, setMatchType] = useState('6');
  const [eloBracket, setEloBracket] = useState(0);
  const [days, setDays] = useState(90);
  const [tab, setTab] = useState<'civs' | 'maps' | 'levels'>('civs');

  //  Si ha entrado con Steam, se le resalta su propio escalon en la tabla.
  const { user } = useSession();
  const { data: yo } = useQuery({
    queryKey: ['player', user?.profile_id],
    queryFn: () => getPlayer(String(user!.profile_id)),
    enabled: !!user?.profile_id && tab === 'levels',
    staleTime: 10 * 60 * 1000,
  });
  const miRating = yo?.player?.ladders?.find((l) => l.type === 'solo')?.rating;

  const bracket = ELO_BRACKETS[eloBracket];

  const { data: civData, isLoading: loadingCivs } = useQuery({
    queryKey: ['civMeta', matchType, bracket.min, bracket.max, days],
    queryFn: () => getCivMeta({ match_type: matchType, min_rating: bracket.min, max_rating: bracket.max, days }),
    staleTime: 60_000,
  });

  // Its own request: the matrix costs roughly ten times the list, and making
  // the whole page wait for it left people staring at a spinner.
  const { data: matchupData, isFetching: loadingMatchups } = useQuery({
    queryKey: ['civMatchups', matchType, bracket.min, bracket.max, days],
    queryFn: () => getCivMatchups({ match_type: matchType, min_rating: bracket.min, max_rating: bracket.max, days }),
    enabled: tab === 'civs',
    staleTime: 60_000,
  });

  const { data: mapData, isLoading: loadingMaps } = useQuery({
    queryKey: ['mapMeta', matchType, days],
    queryFn: () => getMapMeta({ match_type: matchType, days }),
    enabled: tab === 'maps',
    staleTime: 60_000,
  });

  //  La API manda win_rate y wins como texto ("55.91"). Sumarlos concatenaba
  //  cadenas, la media salia NaN y la columna de desviacion se quedaba vacia
  //  en produccion: una rayita vertical y nada mas. Se pasan a numero aqui,
  //  una vez, para todo lo que viene despues.
  const civs = (civData?.civilizations || []).map((c) => ({
    ...c,
    win_rate: Number(c.win_rate),
    wins: Number(c.wins),
  }));
  const avgWinRate = civs.length > 0 ? civs.reduce((s, c) => s + c.win_rate, 0) / civs.length : 50;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Helmet>
        <title>Civilization Meta - wololo.top</title>
        <meta name="description" content="AOE2 DE civilization win rates and tier list. See which civs dominate at every ELO bracket." />
        <link rel="canonical" href="https://wololo.top/stats" />
      </Helmet>

      <h1 className="titulo text-2xl sm:text-3xl mb-2 m-0">{t('meta.title')}</h1>
      <p className="text-sm text-gray-500 mb-6 m-0">
        {t('meta.winRatesAcross', { n: civData ? civData.total_matches.toLocaleString() : '...' })}
      </p>

      {/* Filters */}
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Match type */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5 m-0">{t('meta.matchType')}</p>
            <div className="seg">
              {MATCH_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setMatchType(opt.value)}
                  aria-pressed={matchType === opt.value}
                  className={matchType === opt.value ? 'sel-activo' : ''}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {/* ELO bracket */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5 m-0">{t('meta.eloBracket')}</p>
            <div className="seg">
              {ELO_BRACKETS.map((b, i) => (
                <button
                  key={i}
                  onClick={() => setEloBracket(i)}
                  aria-pressed={eloBracket === i}
                  className={eloBracket === i ? 'sel-activo' : ''}
                >
                  {b.label === 'All' ? t('live.mode.all') : b.label}
                </button>
              ))}
            </div>
          </div>
          {/* Time range */}
          <div>
            <p className="text-xs text-gray-500 mb-1.5 m-0">{t('meta.timeRange')}</p>
            <div className="seg">
              {DAYS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDays(opt.value)}
                  aria-pressed={days === opt.value}
                  className={days === opt.value ? 'sel-activo' : ''}
                >
                  {opt.value === 3650 ? t('meta.allTime') : opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs mb-6" role="tablist">
        <button
          onClick={() => setTab('civs')}
          role="tab"
          aria-selected={tab === 'civs'}
          className={`tab ${tab === 'civs' ? 'activa' : ''}`}
        >
          {t('meta.tabCivs')}
        </button>
        <button
          onClick={() => setTab('levels')}
          role="tab"
          aria-selected={tab === 'levels'}
          className={`tab ${tab === 'levels' ? 'activa' : ''}`}
        >
          {t('meta.tabLevels')}
        </button>
        <button
          onClick={() => setTab('maps')}
          role="tab"
          aria-selected={tab === 'maps'}
          className={`tab ${tab === 'maps' ? 'activa' : ''}`}
        >
          {t('meta.tabMaps')}
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
              <p className="text-gray-400 m-0">{t('meta.noData')}</p>
            </div>
          ) : (
            <>
            <TierList civs={civs} media={avgWinRate} />
            <div className="bg-dark-700 border border-dark-400 rounded-sm overflow-x-auto">
              <table className="w-full text-sm sm:min-w-100">
                <thead>
                  <tr className="border-b border-dark-400 bg-dark-800/50">
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-400 font-medium w-8">#</th>
                    <th className="text-left py-3 px-2 sm:px-3 text-gray-400 font-medium">{t('common.civilization')}</th>
                    <th className="text-right py-3 px-2 sm:px-3 text-gray-400 font-medium">{t('common.games')}</th>
                    <th className="text-right py-3 px-2 sm:px-3 text-gray-400 font-medium">{t('common.winRate')}</th>
                    <th className="text-center py-3 px-2 sm:px-3 text-gray-400 font-medium hidden sm:table-cell" style={{ width: '40%' }}>
                      {t('meta.vsAverage', { avg: avgWinRate.toFixed(1) })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {civs.map((civ, i) => {
                    const deviation = civ.win_rate - avgWinRate;
                    const barWidth = Math.min(Math.abs(deviation) * 4, 50);
                    const isAbove = deviation >= 0;
                    return (
                      <tr key={civ.civ_id} className="border-b border-dark-500/50 hover:bg-dark-600/50">
                        <td className="py-2.5 px-2 sm:px-4 text-gray-500 text-xs">{i + 1}</td>
                        <td className="py-2.5 px-2 sm:px-3 text-gray-200 font-medium">
                          <div className="flex items-center gap-2">
                            {getCivIcon(civ.civ_id) && <img src={getCivIcon(civ.civ_id)!} alt="" className="w-5 h-5 rounded object-cover" />}
                            {getCivName(civ.civ_id)}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 sm:px-3 text-right text-gray-400">{civ.games.toLocaleString()}</td>
                        <td className={`py-2.5 px-2 sm:px-3 text-right font-medium ${
                          civ.win_rate >= 52 ? 'text-win' : civ.win_rate <= 48 ? 'text-loss' : 'text-gray-300'
                        }`}>
                          {civ.win_rate.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-2 sm:px-3 hidden sm:table-cell">
                          <div className="flex items-center h-4">
                            <div className="w-1/2 flex justify-end">
                              {!isAbove && (
                                <div
                                  className="h-2.5 bg-loss/70"
                                  style={{ width: `${barWidth}%` }}
                                />
                              )}
                            </div>
                            <div className="w-px h-4 bg-gray-600 shrink-0" />
                            <div className="w-1/2">
                              {isAbove && (
                                <div
                                  className="h-2.5 bg-win/70"
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
            </>
          )}

          {/* Matchups grid */}
          {loadingMatchups && !matchupData && (
            <p className="text-xs text-gray-600 mt-6 m-0">{t('meta.loadingMatchups')}</p>
          )}
          {matchupData?.matchups && matchupData.matchups.length > 0 && (
            <div className="mt-6">
              <h2 className="titulo text-[15px] mb-4 m-0">{t('meta.topMatchups')}</h2>
              <div className="bg-dark-700 border border-dark-400 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-400 bg-dark-800/50">
                      <th className="text-left py-3 px-2 sm:px-4 text-gray-400 font-medium">{t('meta.civA')}</th>
                      <th className="text-left py-3 px-2 sm:px-3 text-gray-400 font-medium">{t('meta.civB')}</th>
                      <th className="text-right py-3 px-2 sm:px-3 text-gray-400 font-medium">{t('common.games')}</th>
                      <th className="text-right py-3 px-2 sm:px-3 text-gray-400 font-medium">{t('meta.aWinPct')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchupData.matchups.slice(0, 50).map((m, i) => (
                      <tr key={i} className="border-b border-dark-500/50 hover:bg-dark-600/50">
                        <td className="py-2 px-2 sm:px-4 text-gray-200">
                          <div className="flex items-center gap-1.5">
                            {getCivIcon(m.civ1) && <img src={getCivIcon(m.civ1)!} alt="" className="w-4 h-4 rounded object-cover" />}
                            {getCivName(m.civ1)}
                          </div>
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-gray-200">
                          <div className="flex items-center gap-1.5">
                            {getCivIcon(m.civ2) && <img src={getCivIcon(m.civ2)!} alt="" className="w-4 h-4 rounded object-cover" />}
                            {getCivName(m.civ2)}
                          </div>
                        </td>
                        <td className="py-2 px-2 sm:px-3 text-right text-gray-400">{m.games.toLocaleString()}</td>
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

      {tab === 'levels' && <LevelBenchmarks matchType={matchType} rating={miRating} />}

      {tab === 'maps' && (
        <>
          {loadingMaps ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !mapData?.maps?.length ? (
            <div className="bg-dark-700 border border-dark-400 rounded-xl p-12 text-center">
              <p className="text-gray-400 m-0">{t('meta.noMapData')}</p>
            </div>
          ) : (
            <div className="bg-dark-700 border border-dark-400 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-400 bg-dark-800/50">
                    <th className="text-left py-3 px-2 sm:px-4 text-gray-400 font-medium w-8">#</th>
                    <th className="text-left py-3 px-2 sm:px-3 text-gray-400 font-medium">{t('common.map')}</th>
                    <th className="text-right py-3 px-2 sm:px-3 text-gray-400 font-medium">{t('common.games')}</th>
                    <th className="text-right py-3 px-2 sm:px-3 text-gray-400 font-medium">{t('meta.avgDuration')}</th>
                    <th className="text-right py-3 px-2 sm:px-3 text-gray-400 font-medium">{t('common.players')}</th>
                  </tr>
                </thead>
                <tbody>
                  {mapData.maps.map((m, i) => (
                    <tr key={i} className="border-b border-dark-500/50 hover:bg-dark-600/50">
                      <td className="py-2.5 px-2 sm:px-4 text-gray-500 text-xs">{i + 1}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-gray-200 font-medium">{cleanMapName(m.map_name)}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-right text-gray-400">{m.games.toLocaleString()}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-right text-gray-400">{m.avg_duration ? formatDuration(m.avg_duration) : '-'}</td>
                      <td className="py-2.5 px-2 sm:px-3 text-right text-gray-400">{m.unique_players.toLocaleString()}</td>
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

/*
  La tier list: lo que la gente cita y comparte del meta. Los cortes son
  puntos de porcentaje sobre la media de este mismo filtro, no un numero
  magico: S es ganar tres puntos mas que la civ media, D perder tres.
*/
const TIERS = [
  { clave: 'S', min: 3, color: '#e3b341' },
  { clave: 'A', min: 1, color: '#d9b06a' },
  { clave: 'B', min: -1, color: '#b8ad96' },
  { clave: 'C', min: -3, color: '#b8814a' },
  { clave: 'D', min: -Infinity, color: '#e0604f' },
];

function TierList({ civs, media }: { civs: { civ_id: number; win_rate: number; games: number }[]; media: number }) {
  const { t } = useT();
  if (civs.length === 0) return null;
  return (
    <section aria-labelledby="tiers" className="mb-6 border border-dark-400 rounded-sm bg-dark-700">
      <div className="flex items-baseline justify-between gap-4 px-4 py-3 border-b border-dark-400">
        <h2 id="tiers" className="titulo text-[14px] m-0">{t('meta.tierTitle')}</h2>
        <span className="font-mono text-xs text-gray-500">{t('meta.tierNote', { avg: media.toFixed(1) })}</span>
      </div>
      {TIERS.map((tier, i) => {
        const max = i === 0 ? Infinity : TIERS[i - 1].min;
        const fila = civs.filter((c) => c.win_rate - media >= tier.min && c.win_rate - media < max);
        if (fila.length === 0) return null;
        return (
          <div key={tier.clave} className="grid grid-cols-[3rem_minmax(0,1fr)] border-b border-dark-500 last:border-b-0">
            <div className="grid place-items-center border-r border-dark-500 font-display text-2xl font-bold" style={{ color: tier.color }}>
              {tier.clave}
            </div>
            <ul className="list-none m-0 p-2.5 flex flex-wrap gap-1.5">
              {fila.map((c) => {
                const icono = getCivIcon(c.civ_id);
                return (
                  <li key={c.civ_id} title={`${getCivName(c.civ_id)} · ${c.win_rate.toFixed(1)}% · ${c.games.toLocaleString()}`}>
                    <span className="flex items-center gap-1.5 pl-1 pr-2 py-1 bg-dark-800 border border-dark-400 rounded-sm">
                      {icono && <img src={icono} alt="" className="w-7 h-7 object-contain" loading="lazy" />}
                      <span className="text-sm font-medium text-gray-100">{getCivName(c.civ_id)}</span>
                      <span className="cifra text-sm text-gray-400">{c.win_rate.toFixed(1)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
