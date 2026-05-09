import { useState } from 'react';
import { cleanMapName } from '../lib/constants';
import type { MapStat } from '../lib/types';

interface MapStatsTableProps {
  stats: MapStat[];
}

type SortKey = 'map' | 'games' | 'wins' | 'losses' | 'win_rate';
type SortDir = 'asc' | 'desc';

export default function MapStatsTable({ stats }: MapStatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('games');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'map' ? 'asc' : 'desc');
    }
  };

  const sorted = [...stats].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'map':
        cmp = cleanMapName(a.map_name).localeCompare(cleanMapName(b.map_name));
        break;
      case 'games':
        cmp = a.games - b.games;
        break;
      case 'wins':
        cmp = a.wins - b.wins;
        break;
      case 'losses':
        cmp = a.losses - b.losses;
        break;
      case 'win_rate':
        cmp = a.win_rate - b.win_rate;
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-gray-600">
      {sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : '▼'}
    </span>
  );

  if (stats.length === 0) {
    return <p className="text-gray-500 text-sm">No map data available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dark-400">
            <th
              onClick={() => handleSort('map')}
              className="text-left py-3 px-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200 transition-colors"
            >
              Map <SortIcon col="map" />
            </th>
            <th
              onClick={() => handleSort('games')}
              className="text-right py-3 px-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200 transition-colors"
            >
              Games <SortIcon col="games" />
            </th>
            <th
              onClick={() => handleSort('wins')}
              className="text-right py-3 px-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200 transition-colors"
            >
              Wins <SortIcon col="wins" />
            </th>
            <th
              onClick={() => handleSort('losses')}
              className="text-right py-3 px-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200 transition-colors"
            >
              Losses <SortIcon col="losses" />
            </th>
            <th
              onClick={() => handleSort('win_rate')}
              className="text-right py-3 px-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200 transition-colors"
            >
              Win Rate <SortIcon col="win_rate" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((map) => {
            const wr = map.win_rate;
            const barColor = wr >= 55 ? 'bg-win' : wr >= 45 ? 'bg-gold-500' : 'bg-loss';
            return (
              <tr
                key={map.map_name}
                className="border-b border-dark-500/50 hover:bg-dark-600/50 transition-colors"
              >
                <td className="py-2.5 px-3 font-medium text-gray-200">
                  {cleanMapName(map.map_name)}
                </td>
                <td className="py-2.5 px-3 text-right text-gray-400">{map.games}</td>
                <td className="py-2.5 px-3 text-right text-win">{map.wins}</td>
                <td className="py-2.5 px-3 text-right text-loss">{map.losses}</td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-dark-400 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full`}
                        style={{ width: `${Math.min(wr, 100)}%` }}
                      />
                    </div>
                    <span className={`font-medium ${wr >= 55 ? 'text-win' : wr >= 45 ? 'text-gold-400' : 'text-loss'}`}>
                      {wr.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
