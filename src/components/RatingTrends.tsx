import { useQuery } from '@tanstack/react-query';
import { getRatingTrends } from '../lib/api';
import type { RatingTrendsResponse, LadderTrend } from '../lib/types';

const LADDER_LABELS: Record<string, string> = {
  rm: 'Solo RM',
  team_rm: 'Team RM',
};

const LADDER_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  rm: { text: 'text-gold-400', bg: 'bg-gold-500/10', border: 'border-gold-500/20' },
  team_rm: { text: 'text-blue-accent', bg: 'bg-blue-accent/10', border: 'border-blue-accent/20' },
};

function DeltaBadge({ value, label }: { value: number | null; label: string }) {
  if (value === null || value === undefined) return null;
  const isPositive = value > 0;
  const isZero = value === 0;
  const color = isZero ? 'text-gray-500' : isPositive ? 'text-win' : 'text-loss';
  const arrow = isZero ? '' : isPositive ? '▲' : '▼';
  const sign = isPositive ? '+' : '';

  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${color} bg-dark-500/60`}>
      {arrow}{sign}{value} <span className="text-gray-500 font-normal">{label}</span>
    </span>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null;
  const isWin = streak > 0;
  const abs = Math.abs(streak);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
        isWin
          ? 'bg-win/15 text-win border border-win/20'
          : 'bg-loss/15 text-loss border border-loss/20'
      }`}
    >
      {isWin ? '🔥' : '❄️'}{abs}{isWin ? 'W' : 'L'}
    </span>
  );
}

function LadderTrendRow({ ladderKey, trend }: { ladderKey: string; trend: LadderTrend }) {
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
          <span className="text-gray-500">Peak:</span>
          <span className="font-semibold text-gray-300">{trend.peak_rating}</span>
        </span>
      )}

      {trend.games_7d != null && trend.games_7d > 0 && (
        <span className="text-xs text-gray-500">
          {trend.games_7d} games <span className="text-gray-600">7d</span>
        </span>
      )}
    </div>
  );
}

interface Props {
  profileId: string | number;
}

export default function RatingTrends({ profileId }: Props) {
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
    return null;
  }

  const ladderKeys = Object.keys(data.ladders).filter(k => k in LADDER_LABELS);
  const { current_streak, best_win_streak, worst_loss_streak } = data.streaks;

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider m-0">Trends</h3>
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
          <span className="text-xs text-gray-500">Historical:</span>
          {best_win_streak > 1 && (
            <span className="text-xs text-win/80">
              Best streak: <span className="font-semibold text-win">{best_win_streak}W</span>
            </span>
          )}
          {worst_loss_streak > 1 && (
            <span className="text-xs text-loss/80">
              Worst streak: <span className="font-semibold text-loss">{worst_loss_streak}L</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
