import { Link } from 'react-router-dom';
import { useT } from '../lib/i18n';
import type { TKey } from '../lib/i18n';
import type { EvidenceState, SharedAccountDetection } from '../lib/types';

function fmtDate(value: string | null, lang: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const EV_KEY: Record<EvidenceState, TKey> = {
  match: 'signals.ev.match',
  differ: 'signals.ev.differ',
  unknown: 'signals.ev.unknown',
};

const EV_CLASS: Record<EvidenceState, string> = {
  match: 'text-amber-300',
  differ: 'text-gray-400',
  // Lo que no sabemos se ensena apagado y dicho: el detector guarda
  // "misma ciudad" cuando ninguna de las dos cuentas tiene ciudad.
  unknown: 'text-gray-600',
};

function EvidenceRow({ labelKey, state }: { labelKey: TKey; state: EvidenceState }) {
  const { t } = useT();
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-dark-400/40 last:border-0">
      <span className="text-xs text-gray-500">{t(labelKey)}</span>
      <span className={`text-xs ${EV_CLASS[state]}`}>{t(EV_KEY[state])}</span>
    </div>
  );
}

/**
 * Lo que de verdad sabemos de una deteccion de juego familiar compartido.
 *
 * Reglas de redaccion, porque esto senala a una persona:
 *  - se describe el hecho observado ("Steam informo de que..."), no un juicio;
 *  - la confianza va siempre pegada al hecho;
 *  - la evidencia se detalla, incluidos los huecos ("sin datos");
 *  - se recuerda que compartir la biblioteca es legitimo en Steam.
 * Si no hay deteccion, no se pinta nada: una tarjeta que diga "sin senales"
 * invita a sospechar de todo el mundo.
 */
export default function SharedAccountCard({
  detections,
}: {
  detections: SharedAccountDetection[] | undefined;
}) {
  const { t, lang } = useT();
  if (!detections || detections.length === 0) return null;

  return (
    <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9a2 2 0 012-2h2m5 7V3m0 0L8.5 6.5M12 3l3.5 3.5" />
        </svg>
        <h2 className="text-base font-semibold text-amber-200 m-0">{t('signals.shared.title')}</h2>
      </div>

      <div className="flex flex-col gap-4">
        {detections.map((d, i) => {
          const first = fmtDate(d.detected_at, lang);
          const last = fmtDate(d.last_seen, lang);
          const methodKey = d.detection_method
            ? (`signals.shared.method.${d.detection_method}` as TKey)
            : null;
          const apart = d.evidence.accounts_created_days_apart;

          return (
            <div key={d.detection_id ?? i} className="flex flex-col gap-3">
              <p className="text-sm text-gray-300 m-0 leading-relaxed">
                {d.lender_name
                  ? t('signals.shared.lead', { lender: d.lender_name })
                  : t('signals.shared.leadNoName')}
              </p>

              {d.lender_name && d.lender_profile_id != null && (
                <p className="text-xs text-gray-500 m-0">
                  {t('signals.shared.owner')}:{' '}
                  <Link
                    to={`/player/${d.lender_profile_id}`}
                    className="text-amber-200 hover:text-amber-100 no-underline font-medium"
                  >
                    {d.lender_name}
                  </Link>
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 font-medium tabular-nums">
                  {t('signals.shared.confidence', { n: d.confidence })}
                </span>
                {d.detection_count != null && d.detection_count > 0 && (
                  <span className="text-gray-500">
                    {d.detection_count === 1
                      ? t('signals.shared.confirmedOnce')
                      : t('signals.shared.confirmed', { n: d.detection_count })}
                  </span>
                )}
                {methodKey && <span className="text-gray-600">{t(methodKey)}</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-600 m-0 mb-1">
                    {t('signals.shared.basis')}
                  </p>
                  <EvidenceRow labelKey="signals.shared.sameCountry" state={d.evidence.country} />
                  <EvidenceRow labelKey="signals.shared.sameState" state={d.evidence.state} />
                  <EvidenceRow labelKey="signals.shared.sameCity" state={d.evidence.city} />
                </div>
                <div className="flex flex-col gap-1 mt-3 sm:mt-0 sm:pt-[22px]">
                  {apart != null && (
                    <p className="text-xs text-gray-500 m-0">
                      {apart === 0
                        ? t('signals.shared.createdSameDay')
                        : t('signals.shared.createdApart', { n: apart })}
                    </p>
                  )}
                  {first && <p className="text-xs text-gray-500 m-0">{t('signals.shared.firstDetected', { date: first })}</p>}
                  {last && <p className="text-xs text-gray-500 m-0">{t('signals.shared.lastSeen', { date: last })}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-600 mt-4 mb-0 leading-relaxed">
        {t('signals.shared.howScored')} {t('signals.shared.note')}
      </p>
    </div>
  );
}
