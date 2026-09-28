import { useT } from '../lib/i18n';
interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** what the rows are, for the "1-10 of 42 maps" line */
  noun: string;
}

/**
 * Shared pager for the profile stat tables. A player with 40 civilisations and
 * 50 maps had both lists rendered in full, which on mobile meant scrolling past
 * a hundred rows to reach the next section.
 */
export default function TablePagination({ page, pageSize, total, onPageChange, noun }: TablePaginationProps) {
  const { t } = useT();
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const btn = (enabled: boolean) =>
    `px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
      enabled
        ? 'text-gray-400 border-dark-400 hover:text-gray-200 hover:border-gray-500'
        : 'text-gray-600 border-transparent cursor-not-allowed'
    }`;

  return (
    <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-dark-500/60 flex-wrap">
      <span className="text-xs text-gray-500">
        {from.toLocaleString()}–{to.toLocaleString()} {t('common.of')} {total.toLocaleString()} {noun}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className={btn(page !== 1)}
          aria-label={`Previous page of ${noun}`}
        >
          {t('common.previous')}
        </button>
        <span className="px-2 text-xs text-gray-500 tabular-nums">
          {page} / {pages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          className={btn(page !== pages)}
          aria-label={`Next page of ${noun}`}
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}
