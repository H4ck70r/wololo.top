import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getPercentileHistory } from '../lib/api';
import { useT } from '../lib/i18n';
import type { PercentilePoint, PercentileSeries } from '../lib/types';

/**
 * El percentil de un jugador a lo largo del tiempo.
 *
 * El historial de rating de al lado engana: si el ladder entero se infla, el
 * numero sube sin que el jugador haya mejorado. Esto mide lo unico que no se
 * puede inflar, cuanta gente tiene por encima.
 *
 * El eje va al reves a proposito: el top 1% arriba y el top 100% abajo. Es lo
 * contrario de lo normal en un grafico, pero es lo que la gente espera cuando
 * lee "subir en el ladder", y la alternativa (percentil creciendo hacia arriba)
 * dibujaba una mejora como una caida.
 */

const LADDER_CONFIG = {
  rm: { label: 'Solo RM', color: '#d4a843' },
  team_rm: { label: 'Team RM', color: '#60a5fa' },
} as const;

type LadderKey = keyof typeof LADDER_CONFIG;

const RANGE_OPTIONS = [
  { label: '90d', days: 90 },
  { label: '180d', days: 180 },
  { label: '1y', days: 365 },
];

/** Los cortes que sirven de referencia, si caen dentro de lo dibujado. */
const GUIDES = [50, 25, 10, 5, 1];

interface Props {
  profileId: string | number;
  /** se nombra al jugador en vez de decir "tu" cuando no es su propio perfil */
  playerName?: string;
  isSelf?: boolean;
}

type ChartPoint = { date: string } & Record<string, number | string>;

export default function PercentileChart({ profileId, playerName, isSelf = false }: Props) {
  const { t, lang } = useT();
  const [days, setDays] = useState(180);
  const [activeLadders, setActiveLadders] = useState<Set<LadderKey>>(new Set(['rm']));
  const [showRating, setShowRating] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['percentileHistory', profileId, days],
    queryFn: () => getPercentileHistory(profileId, { days }),
    enabled: !!profileId,
    staleTime: 30 * 60 * 1000,
  });

  const available = data
    ? (Object.keys(data.ladders) as LadderKey[]).filter((k) => k in LADDER_CONFIG)
    : [];
  const shown = available.filter((l) => activeLadders.has(l));
  // Apagar el ultimo ladder dejaria el bloque vacio sin que se entienda por que.
  const visible = shown.length ? shown : available.slice(0, 1);

  const toggleLadder = (key: LadderKey) => {
    setActiveLadders((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const byDate: Record<string, ChartPoint> = {};
  for (const ladder of visible) {
    for (const p of data!.ladders[ladder].points) {
      if (!byDate[p.date]) byDate[p.date] = { date: p.date };
      byDate[p.date][`${ladder}_pct`] = p.top_percent;
      byDate[p.date][`${ladder}_rating`] = p.rating;
      byDate[p.date][`${ladder}_pos`] = p.position;
      byDate[p.date][`${ladder}_size`] = p.ladder_size;
    }
  }
  const chartData = Object.values(byDate).sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const pcts = chartData.flatMap((d) =>
    visible.map((l) => d[`${l}_pct`]).filter((v): v is number => typeof v === 'number')
  );
  // Un dominio fijo de 0 a 100 aplasta la curva: casi todo el mundo vive entre
  // el 5% y el 70%, y la diferencia entre el top 31% y el top 21% -- que es la
  // historia que cuenta el grafico -- quedaba en cuatro pixeles.
  const pctDomain = (() => {
    if (!pcts.length) return [0, 100] as [number, number];
    const lo = Math.min(...pcts);
    const hi = Math.max(...pcts);
    const pad = Math.max(1, (hi - lo) * 0.15);
    return [Math.max(0, Math.floor(lo - pad)), Math.min(100, Math.ceil(hi + pad))] as [number, number];
  })();

  const ratings = chartData.flatMap((d) =>
    visible.map((l) => d[`${l}_rating`]).filter((v): v is number => typeof v === 'number')
  );
  const ratingDomain = (() => {
    if (!ratings.length) return [0, 2000] as [number, number];
    const lo = Math.min(...ratings);
    const hi = Math.max(...ratings);
    const pad = Math.max(30, (hi - lo) * 0.15);
    return [Math.floor((lo - pad) / 10) * 10, Math.ceil((hi + pad) / 10) * 10] as [number, number];
  })();

  const who = isSelf ? null : playerName?.trim() || null;
  const hasData = chartData.length > 1;

  // El veredicto se lee del ladder principal visible, el que manda el grafico.
  const lead: PercentileSeries | undefined = data?.ladders[visible[0]];
  const summary = lead?.summary;

  // El idioma lo manda el selector del sitio, no el del navegador: con la web
  // en espanol las fechas salian en ingles.
  const locale = lang === 'es' ? 'es-ES' : 'en-US';
  const fmtDate = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric' });

  const tile = (label: string, p: PercentilePoint | undefined) =>
    p ? (
      <div key={label} className="bg-dark-600/60 border border-dark-500/60 rounded-lg px-2.5 py-1.5">
        <div className="text-[10px] uppercase tracking-wide text-gray-600">{label}</div>
        <div className="text-sm font-semibold text-gray-200 tabular-nums">
          {t('common.topPercent')} {p.top_percent}%
        </div>
        <div className="text-[10px] text-gray-500 tabular-nums">
          {fmtDate(p.date)} · {p.rating}
        </div>
      </div>
    ) : null;

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-200 m-0">
          {who ? t('pct.titleOther', { who }) : t('pct.title')}
        </h2>
        <div className="flex items-center gap-1.5 flex-wrap">
          {available.map((key) => (
            <button
              key={key}
              onClick={() => toggleLadder(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                visible.includes(key)
                  ? 'border-transparent text-dark-900'
                  : 'border-dark-400 text-gray-500 hover:text-gray-300'
              }`}
              style={visible.includes(key) ? { backgroundColor: LADDER_CONFIG[key].color } : undefined}
            >
              {LADDER_CONFIG[key].label}
            </button>
          ))}
          <div className="w-px h-5 bg-dark-400 mx-0.5" />
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setDays(opt.days)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                days === opt.days ? 'bg-dark-500 text-gray-200' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 m-0">{t('pct.why')}</p>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !hasData ? (
        <p className="text-gray-500 text-sm text-center py-12 m-0">{t('pct.empty')}</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 mt-3 mb-1 flex-wrap">
            <span className="text-[11px] text-gold-400/80 flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
              </svg>
              {t('pct.hint')}
            </span>
            <button
              onClick={() => setShowRating((v) => !v)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                showRating
                  ? 'border-gray-600 text-gray-300'
                  : 'border-dark-400 text-gray-600 hover:text-gray-400'
              }`}
            >
              {t('pct.showRating')}
            </button>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: showRating ? 4 : 10, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#2e3345" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => {
                  const [, m, day] = d.split('-');
                  return `${parseInt(m)}/${parseInt(day)}`;
                }}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={{ stroke: '#2e3345' }}
                tickLine={false}
                minTickGap={40}
              />
              {/* reversed: el top 1% arriba. Sin esto una mejora bajaba. */}
              <YAxis
                yAxisId="pct"
                reversed
                domain={pctDomain}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                tickFormatter={(v: number) => `${v}%`}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              {showRating && (
                <YAxis
                  yAxisId="rating"
                  orientation="right"
                  domain={ratingDomain}
                  tick={{ fill: '#4b5563', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1d28',
                  border: '1px solid #2e3345',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
                labelStyle={{ color: '#e2e8f0' }}
                labelFormatter={(d) =>
                  new Date(`${String(d)}T12:00:00`).toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }
                formatter={(value, name, item) => {
                  const key = String(name);
                  const ladder = key.replace(/_(pct|rating)$/, '') as LadderKey;
                  const label = LADDER_CONFIG[ladder]?.label ?? key;
                  if (key.endsWith('_rating')) return [value, `${label} ${t('pct.rating')}`];
                  const row = item?.payload as Record<string, number> | undefined;
                  const pos = row?.[`${ladder}_pos`];
                  const size = row?.[`${ladder}_size`];
                  return [
                    pos != null && size != null
                      ? `${t('pct.tooltipTop', { pct: Number(value) })} · ${t('pct.tooltipPlace', {
                          position: pos.toLocaleString(locale),
                          total: size.toLocaleString(locale),
                        })}`
                      : t('pct.tooltipTop', { pct: Number(value) }),
                    label,
                  ];
                }}
              />

              {GUIDES.filter((g) => g > pctDomain[0] && g < pctDomain[1]).map((g) => (
                // Sin etiqueta: el eje ya rotula el porcentaje y las dos se
                // pisaban justo en el borde izquierdo.
                <ReferenceLine key={g} yAxisId="pct" y={g} stroke="#3d4358" strokeDasharray="2 4" />
              ))}

              {showRating &&
                visible.map((ladder) => (
                  <Line
                    key={`${ladder}_rating`}
                    yAxisId="rating"
                    type="monotone"
                    dataKey={`${ladder}_rating`}
                    // Gris y no del color del ladder: las dos lineas se mueven
                    // casi igual (es el sentido del bloque, que se vea cuando
                    // NO lo hacen) y en el mismo tono eran la misma linea.
                    stroke="#8b93a7"
                    strokeOpacity={0.55}
                    strokeWidth={1}
                    strokeDasharray="4 3"
                    dot={false}
                    activeDot={false}
                    connectNulls
                  />
                ))}

              {visible.map((ladder) => (
                <Line
                  key={`${ladder}_pct`}
                  yAxisId="pct"
                  type="monotone"
                  dataKey={`${ladder}_pct`}
                  stroke={LADDER_CONFIG[ladder].color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {summary && (
            <div className="mt-4 pt-4 border-t border-dark-500/60">
              <p className="text-sm text-gray-300 m-0 mb-2">
                {summary.percent_change === 0
                  ? t('pct.verdictFlat', { to: summary.last.top_percent })
                  : t(summary.improved ? 'pct.verdictUp' : 'pct.verdictDown', {
                      from: summary.first.top_percent,
                      to: summary.last.top_percent,
                    })}
              </p>
              {/* El caso que justifica todo el bloque: el numero sube y el sitio
                  en el ladder empeora, o al contrario. */}
              {summary.rating_change > 0 && !summary.improved && summary.percent_change !== 0 && (
                <p className="text-xs text-gold-400/90 m-0 mb-2">
                  {t('pct.mirage', { n: summary.rating_change })}
                </p>
              )}
              {summary.rating_change < 0 && summary.improved && (
                <p className="text-xs text-win/90 m-0 mb-2">
                  {t('pct.hiddenGain', { n: Math.abs(summary.rating_change) })}
                </p>
              )}
              <div className="grid grid-cols-3 gap-2">
                {tile(t('pct.statStart'), summary.first)}
                {tile(t('pct.statNow'), summary.last)}
                {tile(t('pct.statBest'), summary.best)}
              </div>
            </div>
          )}

          <p className="text-[11px] text-gray-600 mt-3 m-0">{t('pct.footnote')}</p>
        </>
      )}
    </div>
  );
}
