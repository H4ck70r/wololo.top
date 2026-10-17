import { useT } from '../lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { getRatingTrends } from '../lib/api';
import type { RatingTrendsResponse, LadderTrend } from '../lib/types';
import Flecha from './Flecha';

const LADDER_LABELS: Record<string, string> = {
  rm: 'Solo RM',
  team_rm: 'Team RM',
};

const LADDER_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  rm: { text: 'text-gold-400', bg: 'bg-dark-800', border: 'border-dark-400' },
  team_rm: { text: 'text-blue-300', bg: 'bg-dark-800', border: 'border-dark-400' },
};

function DeltaBadge({ value, label }: { value: number | null; label: string }) {
  if (value === null || value === undefined) return null;
  const isPositive = value > 0;
  const isZero = value === 0;
  const color = isZero ? 'text-gray-500' : isPositive ? 'text-win' : 'text-loss';
  const sign = isPositive ? '+' : '';

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${color} bg-dark-500/60`}>
      {!isZero && <Flecha arriba={isPositive} />}{sign}{value} <span className="text-gray-500 font-normal">{label}</span>
    </span>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  const { t } = useT();
  if (streak === 0) return null;
  const isWin = streak > 0;
  const abs = Math.abs(streak);

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm font-score text-sm font-bold tabular-nums ${
        isWin
          ? 'bg-win/15 text-win border border-win/20'
          : 'bg-loss/15 text-loss border border-loss/20'
      }`}
    >
      {/* Un triangulo dibujado y no un emoji: el fuego y el copo de nieve
          eran iconografia de app de movil, no de un marcador. */}
      <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" aria-hidden="true">
        <path d={isWin ? 'M5 1 9.5 9h-9z' : 'M5 9 .5 1h9z'} fill="currentColor" />
      </svg>
      {abs}{isWin ? t('res.win') : t('res.loss')}
    </span>
  );
}

function LadderTrendRow({ ladderKey, trend }: { ladderKey: string; trend: LadderTrend }) {
  const { t } = useT();
  const colors = LADDER_COLORS[ladderKey] || LADDER_COLORS.rm;
  const label = LADDER_LABELS[ladderKey] || ladderKey;

  return (
    <div className={`flex items-center gap-3 flex-wrap ${colors.bg} ${colors.border} border rounded-lg px-3 py-2`}>
      <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text} min-w-[60px]`}>
        {label}
      </span>

      <div className="flex items-center gap-1.5 flex-wrap">
        <DeltaBadge value={trend.delta_7d} label="7d" />
        <DeltaBadge value={trend.delta_30d} label="30d" />
      </div>

      {trend.peak_rating != null && (
        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
          <span className="text-gray-500">{t('trends.peak')}</span>
          <span className="font-semibold text-gray-300">{trend.peak_rating}</span>
        </span>
      )}

      {trend.games_7d != null && trend.games_7d > 0 && (
        <span className="text-xs text-gray-500">
          {t('trends.games7d', { n: trend.games_7d })}
        </span>
      )}
    </div>
  );
}

interface Props {
  profileId: string | number;
}

export default function RatingTrends({ profileId }: Props) {
  const { t } = useT();
  const { data, isLoading } = useQuery<RatingTrendsResponse>({
    queryKey: ['ratingTrends', profileId],
    queryFn: () => getRatingTrends(profileId),
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-3">
        <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || (Object.keys(data.ladders).length === 0 && data.streaks.current_streak === 0)) {
    return (
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-4">
        <h3 className="titulo text-[13px] m-0 mb-3">{t('trends.title')}</h3>
        <p className="text-gray-500 text-sm text-center py-8 m-0">{t('trends.empty')}</p>
      </div>
    );
  }

  const ladderKeys = Object.keys(data.ladders).filter(k => k in LADDER_LABELS);
  const { current_streak, best_win_streak, worst_loss_streak } = data.streaks;

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="titulo text-[13px] m-0">{t('trends.title')}</h3>
        <div className="flex items-center gap-2">
          {current_streak !== 0 && <StreakBadge streak={current_streak} />}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {ladderKeys.map((key) => (
          <LadderTrendRow key={key} ladderKey={key} trend={data.ladders[key]} />
        ))}
      </div>

      {(best_win_streak > 1 || worst_loss_streak > 1) && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dark-400">
          <span className="text-xs text-gray-500">{t('trends.historical')}</span>
          {best_win_streak > 1 && (
            <span className="text-xs text-win/80">
              {t('trends.bestStreak')} <span className="font-semibold text-win">{best_win_streak}{t('res.win')}</span>
            </span>
          )}
          {worst_loss_streak > 1 && (
            <span className="text-xs text-loss/80">
              {t('trends.worstStreak')} <span className="font-semibold text-loss">{worst_loss_streak}{t('res.loss')}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
