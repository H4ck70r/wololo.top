import { useState } from 'react';
import TablePagination from './TablePagination';
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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const handleSort = (key: SortKey) => {
    setPage(1); // a new ordering makes the current page meaningless
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
        // null win_rate (every game still unresolved) sorts last instead of
        // poisoning the comparison with NaN.
        cmp = (parseFloat(a.win_rate ?? '') || -1) - (parseFloat(b.win_rate ?? '') || -1);
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-dark-400">
            <th
              onClick={() => handleSort('civ')}
              className="text-left py-3 px-2 sm:px-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200 transition-colors"
            >
              <span className="sm:hidden">Civ</span><span className="hidden sm:inline">Civilization</span> <SortIcon col="civ" />
            </th>
            <th
              onClick={() => handleSort('games')}
              className="text-right py-3 px-2 sm:px-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200 transition-colors"
            >
              Games <SortIcon col="games" />
            </th>
            <th
              onClick={() => handleSort('wins')}
              className="hidden sm:table-cell text-right py-3 px-2 sm:px-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200 transition-colors"
            >
              Wins <SortIcon col="wins" />
            </th>
            <th
              onClick={() => handleSort('win_rate')}
              className="text-right py-3 px-2 sm:px-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200 transition-colors"
            >
              <span className="sm:hidden">WR</span><span className="hidden sm:inline">Win Rate</span> <SortIcon col="win_rate" />
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((civ) => {
            // win_rate is null when no game against this entry has a decided
            // result yet; parseFloat(null) used to render as "NaN%".
            const wrRaw = civ.win_rate == null ? NaN : parseFloat(civ.win_rate);
            const hasWr = Number.isFinite(wrRaw);
            const wr = hasWr ? wrRaw : 0;
            const barColor = wr >= 55 ? 'bg-win' : wr >= 45 ? 'bg-gold-500' : 'bg-loss';
            return (
              <tr
                key={civ.civ_id}
                className="border-b border-dark-500/50 hover:bg-dark-600/50 transition-colors"
              >
                <td className="py-2.5 px-2 sm:px-3 font-medium text-gray-200">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    {getCivIcon(civ.civ_id) && (
                      <img src={getCivIcon(civ.civ_id)!} alt="" className="w-5 h-5 sm:w-6 sm:h-6 rounded object-cover shrink-0" />
                    )}
                    {getCivName(civ.civ_id)}
                  </div>
                </td>
                <td className="py-2.5 px-2 sm:px-3 text-right text-gray-400">{civ.games}</td>
                <td className="hidden sm:table-cell py-2.5 px-2 sm:px-3 text-right text-win">{civ.wins}</td>
                <td className="py-2.5 px-2 sm:px-3 text-right">
                  {hasWr ? (
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden sm:block w-16 h-1.5 bg-dark-400 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} rounded-full`}
                          style={{ width: `${Math.min(wr, 100)}%` }}
                        />
                      </div>
                      <span className={`font-medium ${wr >= 55 ? 'text-win' : wr >= 45 ? 'text-gold-400' : 'text-loss'}`}>
                        {wr.toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-600" title="No decided matches yet">&mdash;</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <TablePagination
        page={safePage}
        pageSize={PAGE_SIZE}
        total={sorted.length}
        onPageChange={setPage}
        noun="civilizations"
      />
    </div>
  );
}
