import { useT } from '../lib/i18n';
import type { SignalFlag } from '../lib/types';

/**
 * Distintivo compacto para marcar a un rival en un listado. Deliberadamente
 * ambar y no rojo: esto avisa de una observacion, no declara culpable a nadie.
 * El backend nunca manda detecciones por debajo de confianza 80, asi que
 * cualquier cosa que llegue aqui ya pasa el umbral.
 */
export default function SharedCopyBadge({
  flag,
  compact = false,
}: {
  flag: Pick<SignalFlag, 'lender_name' | 'confidence' | 'detection_count'> | undefined | null;
  compact?: boolean;
}) {
  const { t } = useT();
  if (!flag) return null;

  // El distintivo vive en listados, asi que el detalle va en el tooltip: el
  // hecho, con quien, su confianza y cuantas veces se confirmo. La evidencia
  // completa esta en el perfil, a un clic del nombre.
  const base = flag.lender_name
    ? t('signals.badge.tooltip', { lender: flag.lender_name, n: flag.confidence })
    : t('signals.badge.tooltipNoName', { n: flag.confidence });
  const times = flag.detection_count ?? 0;
  const tooltip =
    times > 0
      ? `${base} · ${times === 1 ? t('signals.shared.confirmedOnce') : t('signals.shared.confirmed', { n: times })}`
      : base;

  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      className={`inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300 shrink-0 ${
        compact ? 'px-1 py-0 text-[9px]' : 'px-1.5 py-0.5 text-[10px]'
      }`}
    >
      <svg className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2h2m5 7V3m0 0L8.5 6.5M12 3l3.5 3.5" />
      </svg>
      {!compact && <span className="font-medium whitespace-nowrap">{t('signals.badge.label')}</span>}
      <span className="tabular-nums opacity-80">{flag.confidence}</span>
    </span>
  );
}
