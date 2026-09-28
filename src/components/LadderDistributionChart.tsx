import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getLadderDistribution, getLeaderboard } from '../lib/api';
import { countryFlag } from '../lib/constants';
import { useT } from '../lib/i18n';
import type { TKey } from '../lib/i18n';
import type { LadderDistribution, LeaderboardResponse } from '../lib/types';

interface Props {
  rating: number | undefined;
  topPercent?: number | null;
  playersAbove?: number | null;
  ladder?: 'solo' | 'team';
}

// Zoom presets. The interesting detail lives in the thin upper tail, which is
// invisible at full scale: past 2000 every bucket is a couple of hundred
// players against a peak of ~28,000, so the curve is flat against the axis.
const ZOOMS = [0, 1500, 2000, 2400];

export default function LadderDistributionChart({ rating, topPercent, playersAbove, ladder = 'solo' }: Props) {
  const { t } = useT();
  const [zoomFrom, setZoomFrom] = useState(0);

  const { data, isLoading } = useQuery<LadderDistribution>({
    queryKey: ['ladderDistribution', ladder],
    queryFn: () => getLadderDistribution(ladder, 50),
    staleTime: 30 * 60 * 1000,
  });

  const { data: top } = useQuery<LeaderboardResponse>({
    queryKey: ['ladderTop10', ladder],
    queryFn: () => getLeaderboard(ladder === 'team' ? 'team-rm' : 'rm', { limit: 10 }),
    staleTime: 30 * 60 * 1000,
  });

  if (isLoading || !data || !rating) return null;

  const marks = data.landmarks;

  let seen = 0;
  const allPoints = data.buckets.map((b) => {
    seen += b.players;
    return { ...b, above: data.total_players - seen };
  });

  const points = allPoints.filter((p) => p.rating >= zoomFrom);
  if (points.length < 2) return null;
  const peak = Math.max(...points.map((p) => p.players));
  const from = points[0].rating;

  // Only draw a landmark if it falls inside the zoomed window, otherwise
  // recharts clamps it to the edge and it reads as a wrong threshold.
  const within = (v: number | null | undefined): v is number => v != null && v >= from;

  const bands = [
    { from: marks.median, to: marks.top_25, key: 'dist.band50' as TKey, fill: '#4a7cff' },
    { from: marks.top_25, to: marks.top_10, key: 'dist.band25' as TKey, fill: '#22c55e' },
    { from: marks.top_10, to: marks.top_1, key: 'dist.band10' as TKey, fill: '#f0c040' },
    { from: marks.top_1, to: marks.top_100_cutoff, key: 'dist.band1' as TKey, fill: '#a855f7' },
    { from: marks.top_100_cutoff, to: data.max_rating, key: 'dist.band100' as TKey, fill: '#ec4899' },
  ].filter((b) => b.from != null && b.to != null && b.to > from) as
    { from: number; to: number; key: TKey; fill: string }[];

  const players = top?.data?.players ?? [];

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
        <h2 className="text-lg font-semibold text-gray-200 m-0">{t('dist.title')}</h2>
        {topPercent != null && (
          <span className="text-sm font-medium text-gold-400">{t('common.topPercent')} {topPercent}%</span>
        )}
      </div>
      {playersAbove != null && (
        <p className="text-xs text-gray-500 m-0">
          {t('dist.subtitle', { above: playersAbove.toLocaleString(), total: data.total_players.toLocaleString() })}
        </p>
      )}

      <div className="flex items-center gap-1 mt-3 mb-1 flex-wrap">
        <span className="text-[11px] uppercase tracking-wider text-gray-600 mr-1">{t('dist.zoomLabel')}</span>
        {ZOOMS.map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => setZoomFrom(z)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              zoomFrom === z ? 'bg-dark-500 text-gold-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {z === 0 ? t('dist.zoomAll') : `${z}+`}
          </button>
        ))}
      </div>

      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="distFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a7cff" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#4a7cff" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="rating"
              type="number"
              domain={['dataMin', 'dataMax']}
              stroke="#3d4358"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickFormatter={(v: number) => String(v)}
              minTickGap={40}
            />
            <YAxis hide domain={[0, peak * 1.1]} />
            <Tooltip
              contentStyle={{ background: '#151821', border: '1px solid #2e3345', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value, _name, item) => {
                const above = (item?.payload as { above?: number } | undefined)?.above ?? 0;
                return [
                  `${Number(value).toLocaleString()} ${t('dist.inThisRange')} · ${above.toLocaleString()} ${t('dist.aboveIt')}`,
                  '',
                ];
              }}
              labelFormatter={(v) => `${v} - ${Number(v) + data.bucket_size - 1}`}
            />

            {within(marks.bulk_from) && within(marks.bulk_to) && (
              <ReferenceArea
                x1={marks.bulk_from}
                x2={marks.bulk_to}
                fill="#6b7280"
                fillOpacity={0.1}
                stroke="#6b7280"
                strokeOpacity={0.35}
                strokeDasharray="2 2"
                label={{
                  value: t('dist.bulk', { from: marks.bulk_from, to: marks.bulk_to }),
                  position: 'insideBottom',
                  fill: '#9ca3af',
                  fontSize: 10,
                  offset: 8,
                }}
              />
            )}

            {bands.map((b) => (
              <ReferenceArea
                key={b.key}
                x1={Math.max(b.from, from)}
                x2={b.to}
                fill={b.fill}
                fillOpacity={0.06}
                stroke="none"
                label={{ value: t(b.key), position: 'insideTop', fill: b.fill, fontSize: 10, offset: 4 }}
              />
            ))}

            <Area type="monotone" dataKey="players" stroke="#4a7cff" strokeWidth={1.5} fill="url(#distFill)" />

            {within(marks.median) && <ReferenceLine x={marks.median} stroke="#3d4358" strokeDasharray="3 3" />}
            {within(marks.top_25) && <ReferenceLine x={marks.top_25} stroke="#3d4358" strokeDasharray="3 3" />}
            {within(marks.top_10) && <ReferenceLine x={marks.top_10} stroke="#3d4358" strokeDasharray="3 3" />}
            {within(marks.top_1) && <ReferenceLine x={marks.top_1} stroke="#3d4358" strokeDasharray="3 3" />}
            {within(marks.top_100_cutoff) && (
              <ReferenceLine x={marks.top_100_cutoff} stroke="#a855f7" strokeDasharray="3 3" />
            )}
            {within(rating) && (
              <ReferenceLine
                x={rating}
                stroke="#f0c040"
                strokeWidth={2}
                label={{ value: t('dist.you'), position: 'top', fill: '#f0c040', fontSize: 10 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-gray-600 mt-3 m-0">{t('dist.footnote')}</p>

      <div className="mt-4 pt-4 border-t border-dark-500/60">
        <h3 className="text-sm font-semibold text-gray-300 m-0 mb-2">{t('dist.top10title')}</h3>
        {players.length === 0 ? (
          <p className="text-xs text-gray-600 m-0">{t('dist.top10empty')}</p>
        ) : (
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 m-0 p-0 list-none">
            {players.slice(0, 10).map((p, i) => (
              <li key={p.profile_id} className="flex items-center gap-2 text-xs py-0.5 min-w-0">
                <span className={`w-5 shrink-0 tabular-nums ${i === 0 ? 'text-gold-400 font-bold' : 'text-gray-600'}`}>
                  {i + 1}
                </span>
                <span className="shrink-0">{countryFlag(p.country)}</span>
                <Link
                  to={`/player/${p.profile_id}`}
                  className="text-blue-accent hover:text-blue-400 no-underline truncate min-w-0"
                >
                  {p.alias || p.name}
                </Link>
                <span className="ml-auto shrink-0 tabular-nums text-gray-400 font-medium">{p.rating}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
