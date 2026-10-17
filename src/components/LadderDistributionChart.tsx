import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getEnhancedLeaderboard, getLadderDistribution, getLadderRangeStats, getLeaderboard } from '../lib/api';

import { useT } from '../lib/i18n';
import type { TKey } from '../lib/i18n';
import type {
  EnhancedLeaderboardResponse,
  LadderDistribution,
  LadderRangeStats,
  LeaderboardResponse,
} from '../lib/types';
import TablePagination from './TablePagination';
import Bandera from './Bandera';

interface Props {
  /** undefined on pages with no single player: the curve renders unmarked */
  rating?: number;
  topPercent?: number | null;
  playersAbove?: number | null;
  ladder?: 'solo' | 'team';
  /** only used to highlight this player's own row in the listings */
  profileId?: number | string;
  /** whose profile this is; the card names them instead of saying "you" */
  playerName?: string;
  /** true once a signed-in visitor is looking at the account they claimed */
  isSelf?: boolean;
  /**
   * Pass these to drive the selection from outside. On the leaderboard the
   * bands act as a filter for the table below, so the page owns the choice.
   */
  range?: Band | null;
  onRangeChange?: (range: Band | null) => void;
  /**
   * The leaderboard IS a player listing, so the built-in one would just be a
   * second copy of it.
   */
  showPlayers?: boolean;
}

type Band = { from: number; to: number; top?: number };

/** how many players a range page lists; the top 10 is never paged */
const PAGE_SIZE = 16;

/** What the stat strip needs, whether it describes a range or the whole ladder. */
type Scope = {
  players: number;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  stddev?: number;
  share?: number;
  your_position?: number;
  tied_with?: number;
};

// The detail lives in the thin upper tail, invisible at full scale: past 2000
// every bucket holds a couple of hundred players against a peak of ~28,000, so
// the curve sits flat on the axis. Each range below is clickable to zoom into
// it, which also replaces the in-chart labels: on a phone those overlapped
// into an unreadable "top 50%25%top 10%".

export default function LadderDistributionChart({
  rating,
  topPercent,
  playersAbove,
  ladder = 'solo',
  profileId,
  playerName,
  isSelf = false,
  range: controlledRange,
  onRangeChange,
  showPlayers = true,
}: Props) {
  const { t } = useT();
  const [ownRange, setOwnRange] = useState<Band | null>(null);
  const controlled = onRangeChange != null;
  const range = controlled ? controlledRange ?? null : ownRange;
  const setRange = (next: Band | null) => {
    if (!controlled) setOwnRange(next);
    onRangeChange?.(next);
  };
  const [page, setPage] = useState(1);

  // Page 7 of the previous range means nothing in the next one.
  useEffect(() => { setPage(1); }, [range?.from, range?.to]);

  const { data, isLoading } = useQuery<LadderDistribution>({
    queryKey: ['ladderDistribution', ladder],
    queryFn: () => getLadderDistribution(ladder, 50),
    staleTime: 30 * 60 * 1000,
  });

  const { data: top } = useQuery<LeaderboardResponse>({
    queryKey: ['ladderTop10', ladder],
    queryFn: () => getLeaderboard(ladder === 'team' ? 'team-rm' : 'rm', { limit: 10 }),
    enabled: showPlayers,
    staleTime: 30 * 60 * 1000,
  });

  // Without a range this measures the whole ladder, which also turns the
  // position into an exact place instead of the start of the tie group.
  const { data: rangeStats } = useQuery<LadderRangeStats>({
    queryKey: ['ladderRangeStats', ladder, range?.from, range?.to, range?.top, rating, profileId],
    queryFn: () =>
      getLadderRangeStats({
        type: ladder,
        // `top` answers by place and makes from/to redundant.
        ...(range?.top ? { top: range.top } : { from: range?.from, to: range?.to }),
        rating,
        profile_id: profileId,
      }),
    enabled: rating != null || range != null,
    staleTime: 30 * 60 * 1000,
  });

  const { data: rangeList, isFetching: rangeLoading } = useQuery<EnhancedLeaderboardResponse>({
    queryKey: ['ladderRangeList', ladder, range?.from, range?.to, page],
    queryFn: () =>
      getEnhancedLeaderboard({
        type: ladder === 'team' ? 'team-rm' : 'rm',
        min_rating: range!.from,
        max_rating: range!.to,
        page,
        limit: PAGE_SIZE,
      }),
    enabled: showPlayers && !!range,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !data) return null;

  const marks = data.landmarks;

  // Nothing here knows who is reading, so the card only says "you" when a
  // signed-in visitor is on the account they claimed. Otherwise it addresses
  // the player it is describing by name -- reading "you" on a rival's profile
  // was plainly wrong.
  const who = isSelf ? null : playerName?.trim() || null;
  // The label sits inside the plot, where a long nick would run off the edge.
  const whoShort = who && who.length > 14 ? `${who.slice(0, 13)}…` : who;

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

  const max = data.stats?.max ?? data.max_rating ?? 3000;

  // Each tier means "everyone from here up", which is what the words say.
  // They used to be adjacent slices, so "top 100" started where "elite" ended
  // and a Spaniard ranked 7th in the world vanished from "top 100 + Spain".
  //  Los esmaltes de la heraldica, apagados a la luz de la pagina (OKLCH
  //  L 0.52-0.67, C 0.10-0.13): sinople, azur, tenne, purpura, oro y gules.
  //  Cada franja tiene que distinguirse de la de al lado a simple vista; con
  //  la escala de bronce eran seis marrones casi iguales. Validada con el
  //  script de dataviz contra el fondo #14120e: separacion para daltonismo
  //  y vision normal y contraste, todo en verde.
  const tiers = [
    { key: 'dist.band50' as TKey, fill: '#549864', cutoff: marks.median },
    { key: 'dist.band25' as TKey, fill: '#4576b4', cutoff: marks.top_25 },
    { key: 'dist.band10' as TKey, fill: '#c17938', cutoff: marks.top_10 },
    { key: 'dist.band1' as TKey, fill: '#875093', cutoff: marks.top_1 },
    { key: 'dist.band100' as TKey, fill: '#ac942f', cutoff: marks.top_100_cutoff, top: 100 },
    { key: 'dist.bandElite' as TKey, fill: '#b14d51', cutoff: marks.elite_cutoff, top: 16 },
  ].filter((tier) => tier.cutoff != null) as
    { key: TKey; fill: string; cutoff: number; top?: number }[];

  // The one band that is genuinely a middle: it says "average", not "top X".
  const bulk =
    marks.bulk_from != null && marks.bulk_to != null
      ? { from: marks.bulk_from, to: marks.bulk_to, key: 'dist.bulk' as TKey, fill: '#a39a86' }
      : null;

  // What a chip selects: nested, from its cutoff to the very top.
  const ranges: { from: number; to: number; key: TKey; fill: string; top?: number }[] = [
    ...(bulk ? [bulk] : []),
    ...tiers.map((tier) => ({
      from: tier.cutoff,
      to: max,
      key: tier.key,
      fill: tier.fill,
      top: tier.top,
    })),
  ];

  // What the chart paints, and what a click on the plot resolves to: the strip
  // between one cutoff and the next. Nested fills would just stack into mud,
  // and a click has to land on one tier, not on five at once.
  const segments = tiers.map((tier, i) => ({
    ...tier,
    from: tier.cutoff,
    to: tiers[i + 1]?.cutoff ?? max,
  }));

  const activeBand = range
    ? ranges.find((r) => r.from === range.from && r.to === range.to)
    : undefined;
  const effectiveTop = range?.top ?? activeBand?.top;

  const visibleSegments = segments.filter((seg) => seg.to > from);

  const players = top?.data?.players ?? [];

  // With no range selected the strip describes the whole ladder, and the
  // position comes from the profile's own exact count rather than from the
  // buckets; with a range it is whatever the range endpoint measured.
  const whole = data.stats;
  const scope: Scope | undefined = rangeStats
    ? rangeStats
    : !range && whole
      ? {
          players: whole.total_players,
          mean: whole.mean,
          median: whole.median,
          min: whole.min,
          max: whole.max,
          stddev: whole.stddev,
          your_position: playersAbove != null ? playersAbove + 1 : undefined,
        }
      : undefined;

  const tiles: { key: TKey; value: number }[] = [];
  if (scope?.mean != null) tiles.push({ key: 'dist.statAvg', value: scope.mean });
  if (scope?.median != null) tiles.push({ key: 'dist.statMedian', value: scope.median });
  if (scope?.min != null) tiles.push({ key: 'dist.statBottom', value: scope.min });
  if (scope?.max != null) tiles.push({ key: 'dist.statTop', value: scope.max });
  if (scope?.stddev != null) tiles.push({ key: 'dist.statSpread', value: scope.stddev });

  // A count band lists exactly that many players: the rating filter alone
  // would let anyone tied on the boundary rating slip in as a 17th.
  const cap = effectiveTop;
  const listed = rangeList?.data?.players ?? [];
  const rangeRows = cap
    ? listed.slice(0, Math.max(0, cap - (page - 1) * PAGE_SIZE))
    : listed;
  const rangeTotal = cap
    ? cap
    : rangeList?.data?.pagination?.total ?? scope?.players ?? 0;
  // Landing on page 1 of a range holding 100,000 players buries you; this is
  // the page your own rating falls on.
  const myPage =
    range && rangeStats?.your_position ? Math.ceil(rangeStats.your_position / PAGE_SIZE) : null;

  const row = (
    p: { profile_id: number; country: string | null; alias?: string | null; name: string; rating: number },
    pos: number
  ) => {
    const mine = profileId != null && String(p.profile_id) === String(profileId);
    return (
      <li
        key={p.profile_id}
        className={`flex items-center gap-2 text-xs py-1 min-w-0 ${
          mine ? 'bg-gold-500/10 rounded px-1.5 -mx-1.5' : ''
        }`}
      >
        <span
          className={`min-w-[1.75rem] shrink-0 tabular-nums text-right ${
            pos === 1 ? 'text-gold-400 font-bold' : 'text-gray-600'
          }`}
        >
          {pos}
        </span>
        <Bandera code={p.country} />
        <Link
          to={`/player/${p.profile_id}`}
          className={`no-underline truncate min-w-0 ${
            mine ? 'text-gold-400 font-semibold' : 'text-gray-200 hover:text-gold-400'
          }`}
        >
          {p.alias || p.name}
        </Link>
        <span className="ml-auto shrink-0 tabular-nums text-gray-400 font-medium">{p.rating}</span>
      </li>
    );
  };

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
        <h2 className="titulo text-[15px] m-0">
          {rating == null ? t('dist.titleLadder') : who ? t('dist.titleOther', { who }) : t('dist.title')}
        </h2>
        {topPercent != null && (
          <span className="text-sm font-medium text-gold-400">{t('common.topPercent')} {topPercent}%</span>
        )}
      </div>
      {playersAbove != null && (
        <p className="text-xs text-gray-500 m-0">
          {who
            ? t('dist.subtitleOther', {
                who,
                above: playersAbove.toLocaleString(),
                total: data.total_players.toLocaleString(),
              })
            : t('dist.subtitle', {
                above: playersAbove.toLocaleString(),
                total: data.total_players.toLocaleString(),
              })}
        </p>
      )}

      <div className="seg mt-3 mb-2">
        <button type="button" onClick={() => setRange(null)} aria-pressed={range === null} className={range === null ? 'sel-activo' : ''}>
          {t('dist.zoomAll')}
        </button>
        {ranges.map((r) => {
          const active = range?.from === r.from && range?.to === r.to;
          return (
            <button
              key={r.key}
              type="button"
              aria-pressed={active}
              onClick={() => setRange(active ? null : { from: r.from, to: r.to, top: r.top })}
              title={`${r.from} - ${r.to}`}
              className={`inline-flex items-center gap-1.5 ${active ? 'sel-activo' : ''}`}
            >
              {/* La franja tiene su color en la curva: la muestra es la leyenda. */}
              <span className="w-2.5 h-2.5" style={{ backgroundColor: r.fill }} aria-hidden="true" />
              {t(r.key)}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-600 m-0 mb-1">{t('dist.rangeHint')}</p>

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
              const seg = segments.find((sg) => at >= sg.from && at <= sg.to);
              // Below the first cutoff there is no tier, only the average band.
              const hit = seg
                ? { from: seg.cutoff, to: max, top: seg.top }
                : bulk && at >= bulk.from && at <= bulk.to
                  ? { from: bulk.from, to: bulk.to, top: undefined }
                  : null;
              if (!hit) return;
              const same = range && range.from === hit.from && range.to === hit.to;
              setRange(same ? null : hit);
            }}
            style={{ cursor: 'pointer' }}
          >
            <defs>
              <linearGradient id="distFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a39a86" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#a39a86" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="rating"
              type="number"
              domain={['dataMin', 'dataMax']}
              stroke="#3d372b"
              tick={{ fill: '#8f8673', fontSize: 12 }}
              tickFormatter={(v: number) => String(v)}
              minTickGap={40}
            />
            <YAxis hide domain={[0, peak * 1.1]} />
            <Tooltip
              contentStyle={{ background: '#14120e', border: '1px solid #2e2a21', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#ece4d2' }}
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
                fill="#a39a86"
                fillOpacity={0.12}
                stroke="#a39a86"
                strokeOpacity={0.4}
                strokeDasharray="2 2"
              />
            )}

            {visibleSegments.map((seg) => (
              <ReferenceArea
                key={seg.key}
                x1={Math.max(seg.from, from)}
                x2={seg.to}
                fill={seg.fill}
                fillOpacity={0.17}
                stroke="none"
              />
            ))}

            <Area type="monotone" dataKey="players" stroke="#b8ad96" strokeWidth={1.5} fill="url(#distFill)" />

            {within(marks.median) && <ReferenceLine x={marks.median} stroke="#3d372b" strokeDasharray="3 3" />}
            {within(marks.top_25) && <ReferenceLine x={marks.top_25} stroke="#3d372b" strokeDasharray="3 3" />}
            {within(marks.top_10) && <ReferenceLine x={marks.top_10} stroke="#3d372b" strokeDasharray="3 3" />}
            {within(marks.top_1) && <ReferenceLine x={marks.top_1} stroke="#3d372b" strokeDasharray="3 3" />}
            {within(marks.top_100_cutoff) && (
              <ReferenceLine x={marks.top_100_cutoff} stroke="#e3b341" strokeDasharray="3 3" />
            )}
            {within(rating) && (
              <ReferenceLine
                x={rating}
                stroke="#e3b341"
                strokeWidth={2}
                label={{ value: whoShort ?? t('dist.you'), position: 'top', fill: '#e3b341', fontSize: 12 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-600 mt-3 m-0">{t('dist.footnote')}</p>

      {/* The fixed numbers behind whatever is selected. They follow the
          selection, so the heading states which universe they describe. */}
      {scope && tiles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-dark-500/60">
          <div className="flex items-baseline gap-2 flex-wrap mb-2">
            <h3 className="text-sm font-semibold text-gray-300 m-0">
              {range ? t('dist.statsRange') : t('dist.statsWhole')}
            </h3>
            <span className="text-xs text-gray-500 tabular-nums">
              {scope.players.toLocaleString()} {t('dist.statPlayers')}
              {range && scope.share != null &&
                ` · ${t('dist.statShare', { share: scope.share < 0.1 ? '<0.1' : scope.share })}`}
            </span>
          </div>
          {/* Una fila de cifras separadas por lineas, no cinco cajitas. */}
          <dl className="grid grid-cols-3 sm:grid-cols-5 border-y border-dark-400 divide-x divide-dark-400 m-0">
            {tiles.map((tile) => (
              <div key={tile.key} className="px-3 py-2 first:pl-0">
                <dt className="font-mono text-xs uppercase text-gray-500">{t(tile.key)}</dt>
                <dd className="cifra text-xl text-gray-100 m-0 mt-1">
                  {tile.value.toLocaleString()}
                  <span className="font-mono text-xs font-normal text-gray-500 ml-1">ELO</span>
                </dd>
              </div>
            ))}
          </dl>
          {scope.your_position != null && (
            <p className="text-xs text-gray-300 mt-2 m-0">
              {t(who ? 'dist.theirPlace' : 'dist.yourPlace', {
                who: who ?? '',
                position: scope.your_position.toLocaleString(),
                total: scope.players.toLocaleString(),
              })}
              {scope.tied_with != null && scope.tied_with > 0 && (
                <span className="text-gray-500">
                  {' · '}
                  {t(scope.tied_with === 1 ? 'dist.tiedWithOne' : 'dist.tiedWith', {
                    rating: rating ?? '',
                    count: scope.tied_with.toLocaleString(),
                  })}
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {/* One column, always: two columns of five read out of order on a phone
          and the ranking is the whole point of the list. With a range picked
          this becomes that range, best first, paged. */}
      {showPlayers && (
      <div className="mt-4 pt-4 border-t border-dark-500/60">
        <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
          <h3 className="text-sm font-semibold text-gray-300 m-0">
            {range ? t('dist.rangeListTitle', { from: range.from, to: range.to }) : t('dist.top10title')}
          </h3>
          <div className="flex items-center gap-2">
            {myPage != null && myPage !== page && (
              <button
                type="button"
                onClick={() => setPage(myPage)}
                className="text-xs text-gold-400 hover:text-gold-300 bg-transparent border-0 p-0 cursor-pointer underline"
              >
                {who ? t('dist.jumpToOther') : t('dist.jumpToMe')}
              </button>
            )}
            {range && (
              <button
                type="button"
                onClick={() => setRange(null)}
                className="text-xs text-gray-500 hover:text-gray-300 bg-transparent border-0 p-0 cursor-pointer underline"
              >
                {t('dist.backToTop10')}
              </button>
            )}
          </div>
        </div>

        {range ? (
          rangeRows.length === 0 ? (
            <p className="text-xs text-gray-600 m-0">
              {rangeLoading ? `${t('common.loading')}…` : t('dist.rangeEmpty')}
            </p>
          ) : (
            <>
              <ol className="m-0 p-0 list-none">
                {rangeRows.map((p, i) => row(p, (page - 1) * PAGE_SIZE + i + 1))}
              </ol>
              <TablePagination
                page={page}
                pageSize={PAGE_SIZE}
                total={rangeTotal}
                onPageChange={setPage}
                noun={t('dist.playersNoun')}
              />
            </>
          )
        ) : players.length === 0 ? (
          <p className="text-xs text-gray-600 m-0">{t('dist.top10empty')}</p>
        ) : (
          <ol className="m-0 p-0 list-none">{players.slice(0, 10).map((p, i) => row(p, i + 1))}</ol>
        )}
      </div>
      )}
    </div>
  );
}
