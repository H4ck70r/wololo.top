import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getLadderDistribution } from '../lib/api';
import { useT } from '../lib/i18n';
import type { LadderDistribution } from '../lib/types';
import type { TKey } from '../lib/i18n';

interface Props {
  rating: number | undefined;
  topPercent?: number | null;
  playersAbove?: number | null;
  ladder?: 'solo' | 'team';
}

/**
 * Where a rating sits against the whole ladder.
 *
 * Plots the REAL histogram, not a fitted bell curve: AoE2 ratings are strongly
 * skewed (a hard floor near the starting rating, a peak around 900 and a long
 * thin tail past 2000), so a Gaussian would misplace precisely the two ends
 * people look for -- the crowded middle and the top.
 */
export default function LadderDistributionChart({ rating, topPercent, playersAbove, ladder = 'solo' }: Props) {
  const { t } = useT();
  const { data, isLoading } = useQuery<LadderDistribution>({
    queryKey: ['ladderDistribution', ladder],
    queryFn: () => getLadderDistribution(ladder, 50),
    staleTime: 30 * 60 * 1000,
  });

  if (isLoading || !data || !rating) return null;

  const marks = data.landmarks;
  const peak = Math.max(...data.buckets.map((b) => b.players));

  // Each point carries how many players sit above its bucket. Without this the
  // tooltip showed only the bucket ("25 players") right next to a line labelled
  // "top 100", which reads as if the top 100 had 25 people in it.
  let seen = 0;
  const points = data.buckets.map((b) => {
    seen += b.players;
    return { ...b, above: data.total_players - seen };
  });

  // Bands between landmarks, so the eye can place a rating without reading axes.
  const bands = [
    { from: marks.median, to: marks.top_25, key: 'dist.band50' },
    { from: marks.top_25, to: marks.top_10, key: 'dist.band25' },
    { from: marks.top_10, to: marks.top_1, key: 'dist.band10' },
    { from: marks.top_1, to: marks.top_100_cutoff, key: 'dist.band1' },
    // The top 100 band had no upper bound, so it was the one stretch of the
    // chart left unpainted; max_rating closes it.
    { from: marks.top_100_cutoff, to: data.max_rating, key: 'dist.band100' },
  ].filter((b) => b.from != null && b.to != null) as { from: number; to: number; key: TKey }[];
  const bandFill = ['#4a7cff', '#22c55e', '#f0c040', '#a855f7', '#ec4899'];

  const label = (value: string, colour: string) => ({
    value,
    position: 'top' as const,
    fill: colour,
    fontSize: 10,
  });

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
        <h2 className="text-lg font-semibold text-gray-200 m-0">{t('dist.title')}</h2>
        {topPercent != null && (
          <span className="text-sm font-medium text-gold-400">{t('common.topPercent')} {topPercent}%</span>
        )}
      </div>
      {playersAbove != null && (
        <p className="text-xs text-gray-500 m-0 mb-4">
          {t('dist.subtitle', {
            above: playersAbove.toLocaleString(),
            total: data.total_players.toLocaleString(),
          })}
        </p>
      )}

      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 18, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="distFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a7cff" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#4a7cff" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            {/* A numeric axis, not the default category one: the player's exact
                rating (1195) is not one of the 50-point buckets, and a category
                axis silently drops any ReferenceLine whose x is not a category. */}
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
            {/* Drawn first so it sits behind the percentile bands, and
                labelled along the bottom so the two sets never collide. */}
            {marks.bulk_from != null && marks.bulk_to != null && (
              <ReferenceArea
                x1={marks.bulk_from}
                x2={marks.bulk_to}
                fill="#6b7280"
                fillOpacity={0.1}
                stroke="#6b7280"
                strokeOpacity={0.35}
                strokeDasharray="2 2"
                label={{ value: t('dist.bulk'), position: 'insideBottom', fill: '#9ca3af', fontSize: 10, offset: 8 }}
              />
            )}

            {bands.map((b, i) => (
              <ReferenceArea
                key={b.key}
                x1={b.from}
                x2={b.to}
                fill={bandFill[i]}
                fillOpacity={0.06}
                stroke="none"
                label={{ value: t(b.key), position: 'insideTop', fill: bandFill[i], fontSize: 10, offset: 4 }}
              />
            ))}

            <Area type="monotone" dataKey="players" stroke="#4a7cff" strokeWidth={1.5} fill="url(#distFill)" />

            {/* The band labels already name these thresholds, so the divider
                lines stay unlabelled: with both, "top 10%" and "top 1%" were
                printed twice, one above the other. */}
            {marks.median != null && <ReferenceLine x={marks.median} stroke="#3d4358" strokeDasharray="3 3" />}
            {marks.top_25 != null && <ReferenceLine x={marks.top_25} stroke="#3d4358" strokeDasharray="3 3" />}
            {marks.top_10 != null && <ReferenceLine x={marks.top_10} stroke="#3d4358" strokeDasharray="3 3" />}
            {marks.top_1 != null && <ReferenceLine x={marks.top_1} stroke="#3d4358" strokeDasharray="3 3" />}
            {marks.top_100_cutoff != null && (
              <ReferenceLine x={marks.top_100_cutoff} stroke="#a855f7" strokeDasharray="3 3" />
            )}
            <ReferenceLine x={rating} stroke="#f0c040" strokeWidth={2} label={label(t('dist.you'), '#f0c040')} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-gray-600 mt-3 m-0">{t('dist.footnote')}</p>
    </div>
  );
}
