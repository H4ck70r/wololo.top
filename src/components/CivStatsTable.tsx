import { useState } from 'react';
import { getCivName, getCivIcon } from '../lib/constants';
import type { CivStat } from '../lib/types';

interface CivStatsTableProps {
  stats: CivStat[];
}

type SortKey = 'civ' | 'games' | 'wins' | 'win_rate';
type SortDir = 'asc' | 'desc';

export default function CivStatsTable({ stats }: CivStatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('games');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'civ' ? 'asc' : 'desc');
    }
  };

  const sorted = [...stats].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'civ':
        cmp = getCivName(a.civ_id).localeCompare(getCivName(b.civ_id));
        break;
      case 'games':
        cmp = a.games - b.games;
        break;
      case 'wins':
        cmp = Number(a.wins) - Number(b.wins);
        break;
      case 'win_rate':
        cmp = parseFloat(a.win_rate) - parseFloat(b.win_rate);
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
    return <p className="text-gray-500 text-sm">No civilization data available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dark-400">
            <th
              onClick={() => handleSort('civ')}
              className="text-left py-3 px-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200 transition-colors"
            >
              Civilization <SortIcon col="civ" />
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
              onClick={() => handleSort('win_rate')}
              className="text-right py-3 px-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200 transition-colors"
            >
              Win Rate <SortIcon col="win_rate" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((civ) => {
            const wr = parseFloat(civ.win_rate);
            const barColor = wr >= 55 ? 'bg-win' : wr >= 45 ? 'bg-gold-500' : 'bg-loss';
            return (
              <tr
                key={civ.civ_id}
                className="border-b border-dark-500/50 hover:bg-dark-600/50 transition-colors"
              >
                <td className="py-2.5 px-3 font-medium text-gray-200">
                  <div className="flex items-center gap-2">
                    {getCivIcon(civ.civ_id) && (
                      <img src={getCivIcon(civ.civ_id)!} alt="" className="w-6 h-6 rounded object-cover" />
                    )}
                    {getCivName(civ.civ_id)}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right text-gray-400">{civ.games}</td>
                <td className="py-2.5 px-3 text-right text-win">{civ.wins}</td>
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
