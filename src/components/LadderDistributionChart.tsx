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

// The detail lives in the thin upper tail, invisible at full scale: past 2000
// every bucket holds a couple of hundred players against a peak of ~28,000, so
// the curve sits flat on the axis. Each range below is clickable to zoom into
// it, which also replaces the in-chart labels: on a phone those overlapped
// into an unreadable "top 50%25%top 10%".

export default function LadderDistributionChart({ rating, topPercent, playersAbove, ladder = 'solo' }: Props) {
  const { t } = useT();
  const [range, setRange] = useState<{ from: number; to: number } | null>(null);

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

  const points = allPoints.filter(
    (p) => (!range || (p.rating >= range.from && p.rating <= range.to))
  );
  if (points.length < 2) return null;
  const peak = Math.max(...points.map((p) => p.players));
  const from = points[0].rating;

  // Only draw a landmark if it falls inside the zoomed window, otherwise
  // recharts clamps it to the edge and it reads as a wrong threshold.
  const within = (v: number | null | undefined): v is number => v != null && v >= from;

  const max = data.max_rating ?? 3000;
  const ranges = [
    { from: marks.bulk_from, to: marks.bulk_to, key: 'dist.bulk' as TKey, fill: '#9ca3af' },
    { from: marks.median, to: marks.top_25, key: 'dist.band50' as TKey, fill: '#4a7cff' },
    { from: marks.top_25, to: marks.top_10, key: 'dist.band25' as TKey, fill: '#22c55e' },
    { from: marks.top_10, to: marks.top_1, key: 'dist.band10' as TKey, fill: '#f0c040' },
    { from: marks.top_1, to: marks.top_100_cutoff, key: 'dist.band1' as TKey, fill: '#a855f7' },
    { from: marks.top_100_cutoff, to: marks.elite_cutoff ?? max, key: 'dist.band100' as TKey, fill: '#ec4899' },
    { from: marks.elite_cutoff, to: max, key: 'dist.bandElite' as TKey, fill: '#f43f5e' },
  ].filter((r) => r.from != null && r.to != null) as
    { from: number; to: number; key: TKey; fill: string }[];

  // The average band is drawn behind the percentile ones, so it is kept apart.
  const [bulk, ...bands] = ranges;
  const visibleBands = bands.filter((b) => b.to > from);

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

      <div className="flex items-center gap-1.5 mt-3 mb-2 flex-wrap">
        <button
          type="button"
          onClick={() => setRange(null)}
          className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
            range === null
              ? 'bg-dark-500 text-gold-400 border-gold-500/40'
              : 'text-gray-500 border-dark-400 hover:text-gray-300'
          }`}
        >
          {t('dist.zoomAll')}
        </button>
        {ranges.map((r) => {
          const active = range?.from === r.from && range?.to === r.to;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(active ? null : { from: r.from, to: r.to })}
              title={`${r.from} - ${r.to}`}
              className="px-2 py-1 rounded text-xs font-medium border transition-colors"
              style={{
                color: r.fill,
                borderColor: active ? r.fill : 'transparent',
                background: active ? `${r.fill}1f` : `${r.fill}12`,
              }}
            >
              {t(r.key)}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-600 m-0 mb-1">{t('dist.rangeHint')}</p>

      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={points}
            margin={{ top: 18, right: 8, bottom: 0, left: 0 }}
            // Clicking the plot selects whichever range holds that rating, so
            // the bands themselves are the control, not just the chips.
            onClick={(state) => {
              const at = Number((state as { activeLabel?: number | string } | null)?.activeLabel);
              if (!Number.isFinite(at)) return;
              const hit = ranges.find((r) => at >= r.from && at <= r.to);
              if (!hit) return;
              setRange((cur) =>
                cur && cur.from === hit.from && cur.to === hit.to ? null : { from: hit.from, to: hit.to }
              );
            }}
            style={{ cursor: 'pointer' }}
          >
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
              // The series has no meaningful name here, and recharts renders
              // "name: value"; an empty separator avoids a stray leading ": ".
              separator=""
              formatter={(value, _name, item) => {
                const above = (item?.payload as { above?: number } | undefined)?.above ?? 0;
                return [
                  `${Number(value).toLocaleString()} ${t('dist.inThisRange')} · ${above.toLocaleString()} ${t('dist.aboveIt')}`,
                  '',
                ];
              }}
              labelFormatter={(v) => `${v} - ${Number(v) + data.bucket_size - 1}`}
            />

            {/* No text inside the plot: the bands are narrow on a phone and the
                labels ran into each other. The chips above name them instead. */}
            {bulk && within(bulk.from) && within(bulk.to) && (
              <ReferenceArea
                x1={bulk.from}
                x2={bulk.to}
                fill="#9ca3af"
                fillOpacity={0.12}
                stroke="#9ca3af"
                strokeOpacity={0.4}
                strokeDasharray="2 2"
              />
            )}

            {visibleBands.map((b) => (
              <ReferenceArea
                key={b.key}
                x1={Math.max(b.from, from)}
                x2={b.to}
                fill={b.fill}
                fillOpacity={0.06}
                stroke="none"
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

      {/* grid-flow-col over five rows keeps 1-5 in the left column and 6-10 in
          the right one. With the default row flow the columns read 1,3,5,7,9
          and 2,4,6,8,10, which looks out of order. */}
      <div className="mt-4 pt-4 border-t border-dark-500/60">
        <h3 className="text-sm font-semibold text-gray-300 m-0 mb-2">{t('dist.top10title')}</h3>
        {players.length === 0 ? (
          <p className="text-xs text-gray-600 m-0">{t('dist.top10empty')}</p>
        ) : (
          <ol className="grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-5 sm:grid-flow-col gap-x-6 gap-y-1 m-0 p-0 list-none">
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
