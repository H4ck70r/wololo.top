import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { getRatingHistory } from '../lib/api';

const LADDER_CONFIG = {
  rm: { label: 'Solo RM', color: '#d4a843' },
  team_rm: { label: 'Team RM', color: '#60a5fa' },
} as const;

type LadderKey = keyof typeof LADDER_CONFIG;

const RANGE_OPTIONS = [
  { label: '30d', days: 30 },
  { label: '60d', days: 60 },
  { label: '90d', days: 90 },
  { label: 'All', days: 365 },
];

interface Props {
  profileId: string | number;
}

export default function RatingChart({ profileId }: Props) {
  const [days, setDays] = useState(60);
  const [activeLadders, setActiveLadders] = useState<Set<LadderKey>>(new Set(['rm', 'team_rm']));

  const { data, isLoading } = useQuery({
    queryKey: ['ratingHistory', profileId, days],
    queryFn: () => getRatingHistory(profileId, { days }),
    enabled: !!profileId,
  });

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

  const availableLadders = data ? (Object.keys(data.ladders) as LadderKey[]).filter(k => k in LADDER_CONFIG) : [];

  type ChartPoint = { date: string } & Partial<Record<LadderKey, number>>;

  const chartData: ChartPoint[] = (() => {
    if (!data) return [];
    const dateMap: Record<string, Partial<Record<LadderKey, number>>> = {};

    for (const ladder of availableLadders) {
      if (!activeLadders.has(ladder)) continue;
      for (const snap of data.ladders[ladder]) {
        const d = snap.date.slice(0, 10);
        if (!dateMap[d]) dateMap[d] = {};
        dateMap[d][ladder] = snap.rating;
      }
    }

    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, ratings]) => ({ date, ...ratings }));
  })();

  const domain = (() => {
    const ratings = chartData.flatMap(d =>
      availableLadders.filter(l => activeLadders.has(l)).map(l => d[l]).filter((v): v is number => v != null)
    );
    if (ratings.length === 0) return [0, 2000] as [number, number];
    const min = Math.min(...ratings);
    const max = Math.max(...ratings);
    const padding = Math.max(30, Math.round((max - min) * 0.1));
    return [Math.floor((min - padding) / 10) * 10, Math.ceil((max + padding) / 10) * 10] as [number, number];
  })();

  const hasData = availableLadders.length > 0 && chartData.length > 1;

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-200 m-0">Rating History</h2>
        <div className="flex items-center gap-2">
          {availableLadders.map((key) => (
            <button
              key={key}
              onClick={() => toggleLadder(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                activeLadders.has(key)
                  ? 'border-transparent text-dark-900'
                  : 'border-dark-400 text-gray-500 hover:text-gray-300'
              }`}
              style={activeLadders.has(key) ? { backgroundColor: LADDER_CONFIG[key].color } : undefined}
            >
              {LADDER_CONFIG[key].label}
            </button>
          ))}
          <div className="w-px h-5 bg-dark-400 mx-1" />
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.days}
              onClick={() => setDays(opt.days)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                days === opt.days
                  ? 'bg-dark-500 text-gray-200'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !hasData ? (
        <p className="text-gray-500 text-sm text-center py-12">No rating history available yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
            <YAxis
              domain={domain}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1d28',
                border: '1px solid #2e3345',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              labelFormatter={(d) => {
                const date = new Date(String(d) + 'T12:00:00');
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              }}
              formatter={(value, name) => [
                value,
                LADDER_CONFIG[name as LadderKey]?.label || name,
              ]}
            />
            {availableLadders
              .filter((l) => activeLadders.has(l))
              .map((ladder) => (
                <Line
                  key={ladder}
                  type="monotone"
                  dataKey={ladder}
                  stroke={LADDER_CONFIG[ladder].color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
