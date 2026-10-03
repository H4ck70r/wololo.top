import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getLadderDistributionHistory } from '../lib/api';
import { useT } from '../lib/i18n';
import type { TKey } from '../lib/i18n';
import type { DistributionHistoryResponse } from '../lib/types';

/**
 * La curva del ladder de hoy superpuesta a la de hace N meses.
 *
 * Se dibuja en porcentaje del ladder y no en numero de jugadores: el ladder
 * paso de ~185.000 a ~214.000 cuentas en siete meses, asi que en bruto la
 * curva de hoy saldria mas alta en todas partes y eso no es inflacion, es
 * crecimiento. Lo que importa es si la masa se corrio a la derecha.
 */

const MONTH_OPTIONS = [1, 3, 6, 12];

const BEFORE = '#6b7280';
const AFTER = '#4a7cff';

interface Props {
  ladder?: 'solo' | 'team';
  /** se marca donde cae este rating, para leer la curva desde un perfil */
  rating?: number;
}

export default function EloInflationChart({ ladder = 'solo', rating }: Props) {
  const { t, lang } = useT();
  const [months, setMonths] = useState(6);

  const { data, isLoading } = useQuery<DistributionHistoryResponse>({
    queryKey: ['ladderDistributionHistory', ladder, months],
    queryFn: () => getLadderDistributionHistory({ type: ladder, months, bucket: 50 }),
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  if (!data) return null;

  // Un eje de ratings compartido: las dos fechas no tienen los mismos cubos
  // (el techo del ladder se mueve), asi que se unen por rating y los huecos
  // van a 0 en vez de cortar la linea.
  const byRating = new Map<number, { rating: number; before?: number; after?: number }>();
  for (const b of data.before.buckets) {
    byRating.set(b.rating, { rating: b.rating, before: b.share });
  }
  for (const b of data.after.buckets) {
    const hit = byRating.get(b.rating) ?? { rating: b.rating };
    hit.after = b.share;
    byRating.set(b.rating, hit);
  }
  const all = [...byRating.values()]
    .sort((a, b) => a.rating - b.rating)
    .map((p) => ({ rating: p.rating, before: p.before ?? 0, after: p.after ?? 0 }));
  // Los extremos vacios se recortan: con los cubos de 0 a 400 dentro, un tercio
  // del ancho era linea plana y las dos curvas quedaban apretadas en el resto,
  // que es justo donde hay que verlas separarse o no.
  const meaty = (p: { before: number; after: number }) => p.before >= 0.02 || p.after >= 0.02;
  const lo = all.findIndex(meaty);
  const hi = all.length - 1 - [...all].reverse().findIndex(meaty);
  const points = lo >= 0 ? all.slice(lo, hi + 1) : all;

  // El idioma lo manda el selector del sitio, no el del navegador.
  const locale = lang === 'es' ? 'es-ES' : 'en-US';
  const fmtDate = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const shift = data.shift;
  const sign = (n: number) => (n > 0 ? `+${n}` : String(n));
  const verdict =
    Math.abs(shift.median) < 10
      ? t('infl.verdictStable', { n: Math.abs(shift.median) })
      : shift.median > 0
        ? t('infl.verdictInflated', { n: shift.median })
        : t('infl.verdictDeflated', { n: Math.abs(shift.median) });

  const cuts: { key: TKey; value: number }[] = [
    { key: 'infl.shiftMean', value: shift.mean },
    { key: 'infl.shiftMedian', value: shift.median },
    { key: 'infl.shiftTop25', value: shift.top_25 },
    { key: 'infl.shiftTop10', value: shift.top_10 },
    { key: 'infl.shiftTop1', value: shift.top_1 },
  ];

  const labels: Record<string, string> = {
    before: fmtDate(data.before.date),
    after: t('infl.legendAfter'),
  };

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
      <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
        <h2 className="text-lg font-semibold text-gray-200 m-0">{t('infl.title')}</h2>
        <div className="flex items-center gap-1 flex-wrap">
          {MONTH_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                months === m ? 'bg-dark-500 text-gray-200' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-500 m-0">{t('infl.subtitle', { span: data.span_days })}</p>

      <div className="h-60 mt-3 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="inflAfter" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={AFTER} stopOpacity={0.4} />
                <stop offset="100%" stopColor={AFTER} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2e3345" strokeDasharray="3 3" />
            <XAxis
              dataKey="rating"
              type="number"
              domain={['dataMin', 'dataMax']}
              stroke="#3d4358"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickFormatter={(v: number) => `${v}%`}
              axisLine={false}
              tickLine={false}
              width={38}
            />
            <Tooltip
              contentStyle={{
                background: '#151821',
                border: '1px solid #2e3345',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#e2e8f0' }}
              labelFormatter={(v) => `${v} - ${Number(v) + data.bucket_size - 1}`}
              formatter={(value, name) => [`${Number(value).toFixed(2)}%`, labels[String(name)] ?? String(name)]}
            />
            <Legend
              verticalAlign="top"
              height={24}
              iconType="plainline"
              wrapperStyle={{ fontSize: 11, color: '#9ca3af' }}
              formatter={(name) => labels[String(name)] ?? String(name)}
            />

            {/* Las dos medianas: la distancia entre estas dos lineas ES la
                inflacion, mas legible que comparar las jorobas a ojo. */}
            <ReferenceLine x={data.before.median} stroke={BEFORE} strokeDasharray="4 3" />
            <ReferenceLine x={data.after.median} stroke={AFTER} strokeDasharray="4 3" />
            {rating != null && <ReferenceLine x={rating} stroke="#f0c040" strokeWidth={2} />}

            <Area
              type="monotone"
              dataKey="before"
              stroke={BEFORE}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              fill="none"
            />
            <Area type="monotone" dataKey="after" stroke={AFTER} strokeWidth={1.5} fill="url(#inflAfter)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-sm text-gray-300 mt-3 m-0 mb-3">{verdict}</p>

      <div className="mb-1 text-[10px] uppercase tracking-wide text-gray-600">{t('infl.shiftTitle')}</div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {cuts.map((c) => (
          <div key={c.key} className="bg-dark-600/60 border border-dark-500/60 rounded-lg px-2.5 py-1.5">
            <div className="text-[10px] uppercase tracking-wide text-gray-600">{t(c.key)}</div>
            <div
              className={`text-sm font-semibold tabular-nums ${
                c.value > 0 ? 'text-loss' : c.value < 0 ? 'text-win' : 'text-gray-300'
              }`}
            >
              {sign(c.value)}
              <span className="text-[10px] font-normal text-gray-500 ml-1">ELO</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-600 mt-3 m-0">
        {t('infl.footnote', { n: shift.players.toLocaleString(locale) })}
      </p>
    </div>
  );
}
