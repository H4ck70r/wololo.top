import { useQuery } from '@tanstack/react-query';
import { getActivityPatterns } from '../lib/api';
import type { ActivityPatternsResponse } from '../lib/types';

interface Props {
  profileId: string | number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
// MySQL DAYOFWEEK: 1=Sun, 2=Mon, ..., 7=Sat → remap to Mon-Sun row order
const DOW_TO_ROW: Record<number, number> = { 2: 0, 3: 1, 4: 2, 5: 3, 6: 4, 7: 5, 1: 6 };

const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21];

const DAY_NAMES_FULL = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function getColor(games: number, maxGames: number): string {
  if (games === 0 || maxGames === 0) return 'bg-dark-600';
  const ratio = games / maxGames;
  if (ratio <= 0.2) return 'bg-emerald-900/60';
  if (ratio <= 0.4) return 'bg-emerald-700/70';
  if (ratio <= 0.6) return 'bg-emerald-600/80';
  if (ratio <= 0.8) return 'bg-emerald-500';
  return 'bg-emerald-400';
}

export default function ActivityHeatmap({ profileId }: Props) {
  const { data, isLoading } = useQuery<ActivityPatternsResponse>({
    queryKey: ['activityPatterns', profileId],
    queryFn: () => getActivityPatterns(profileId),
    enabled: !!profileId,
  });

  if (isLoading) {
    return (
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-200 m-0 mb-4">Activity Patterns</h2>
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || data.heatmap.length === 0) {
    return (
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-200 m-0 mb-4">Activity Patterns</h2>
        <p className="text-gray-500 text-sm text-center py-8">No activity data available.</p>
      </div>
    );
  }

  // Build 7x24 grid
  const grid: { games: number; wins: number }[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => ({ games: 0, wins: 0 }))
  );

  let maxGames = 0;
  for (const cell of data.heatmap) {
    const row = DOW_TO_ROW[cell.dow];
    if (row !== undefined) {
      grid[row][cell.hour] = { games: cell.games, wins: cell.wins };
      if (cell.games > maxGames) maxGames = cell.games;
    }
  }

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-200 m-0">Activity Patterns</h2>
        <span className="text-xs text-gray-500">{data.total_tracked.toLocaleString()} tracked matches</span>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[540px]">
          {/* Hour labels */}
          <div className="flex ml-10 mb-1">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="flex-1 text-center">
                {HOUR_LABELS.includes(h) ? (
                  <span className="text-[10px] text-gray-500">{h}</span>
                ) : null}
              </div>
            ))}
          </div>

          {/* Rows */}
          {grid.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-0 mb-[2px]">
              <span className="w-10 text-xs text-gray-500 text-right pr-2 shrink-0">
                {DAY_LABELS[rowIdx]}
              </span>
              {row.map((cell, hour) => {
                const winRate = cell.games > 0 ? Math.round((cell.wins / cell.games) * 100) : 0;
                const dayName = DAY_LABELS[rowIdx];
                const hourStr = formatHour(hour);
                const tooltip = cell.games > 0
                  ? `${dayName} ${hourStr}: ${cell.games} game${cell.games !== 1 ? 's' : ''} (${winRate}% win rate)`
                  : `${dayName} ${hourStr}: No games`;

                return (
                  <div
                    key={hour}
                    title={tooltip}
                    className={`flex-1 aspect-square rounded-sm ${getColor(cell.games, maxGames)} cursor-default transition-opacity hover:opacity-80 mx-[1px]`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend + summary */}
      <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Less</span>
          <div className="w-3 h-3 rounded-sm bg-dark-600" />
          <div className="w-3 h-3 rounded-sm bg-emerald-900/60" />
          <div className="w-3 h-3 rounded-sm bg-emerald-700/70" />
          <div className="w-3 h-3 rounded-sm bg-emerald-600/80" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          <span className="text-xs text-gray-500">More</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          {data.most_active_period && (
            <span>
              Most active: <span className="text-gray-200 font-medium">{data.most_active_period}</span>
            </span>
          )}
          {data.peak_hour !== null && (
            <span>
              Peak hour: <span className="text-gray-200 font-medium">{formatHour(data.peak_hour)}</span>
            </span>
          )}
          {data.peak_day !== null && (
            <span>
              Peak day: <span className="text-gray-200 font-medium">{DAY_NAMES_FULL[data.peak_day]}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
