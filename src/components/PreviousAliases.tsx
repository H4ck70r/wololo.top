import type { PreviousAlias } from '../lib/types';
import { useT } from '../lib/i18n';

function formatSeen(a: PreviousAlias): string {
  const d = a.last_seen_at ? new Date(a.last_seen_at) : null;
  if (!d || Number.isNaN(d.getTime())) return a.alias;
  return `${a.alias} — last seen ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

/**
 * Other names the same account has been seen under. The API has been recording
 * these on every alias change (aoe2_alias_history) but nothing displayed them.
 */
export default function PreviousAliases({ aliases }: { aliases?: PreviousAlias[] }) {
  const { t } = useT();
  if (!aliases || aliases.length === 0) return null;

  const shown = aliases.slice(0, 3);
  const rest = aliases.length - shown.length;

  return (
    <p className="text-sm text-gray-500 mt-1 m-0 flex items-baseline gap-1.5 flex-wrap">
      <span className="text-xs uppercase tracking-wider text-gray-600 shrink-0">{t('profile.aka')}</span>
      {shown.map((a, i) => (
        <span key={a.alias} className="text-gray-400" title={formatSeen(a)}>
          {a.alias}
          {i < shown.length - 1 ? ',' : ''}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-gray-600" title={aliases.slice(3).map((a) => a.alias).join(', ')}>
          +{rest} more
        </span>
      )}
    </p>
  );
}
