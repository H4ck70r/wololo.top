import { useQuery } from '@tanstack/react-query';
import { getPlayerAssessment } from '../lib/api';
import { useT } from '../lib/i18n';
import type { AssessmentResponse, AssessmentMetric } from '../lib/types';

interface Props {
  profileId: number | string;
  matchType?: string;
}

/** mm:ss para los tiempos de edad, que es como los lee un jugador. */
const reloj = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/**
 * Lo que se ensena de una edad es el tiempo de ATERRIZAJE, no el de la
 * peticion. El replay solo registra el clic, pero la cifra que usa todo el
 * mundo —las guias, los coaches, YouTube— es cuando la edad cae. Publicar la
 * peticion con la misma etiqueta hace que el jugador compare su 18:38 con el
 * 19:00 de su guia y crea que va bien cuando va dos minutos tarde.
 *
 * Los segundos a sumar los manda la API en research_s, para que el dia que un
 * parche los cambie no haya que buscarlos en el frontend.
 */
function formato(m: AssessmentMetric, v: number | null): string {
  if (v == null) return '—';
  if (m.key === 'tc_idle_ms') return `${Math.round(v)}s`;
  if (m.unit === 's') return reloj(v + (m.research_s ?? 0));
  return v.toFixed(1);
}

/** El tiempo del clic, que es lo que el jugador controla. */
function pedida(m: AssessmentMetric, v: number | null): string | null {
  if (v == null || !m.research_s) return null;
  return reloj(v);
}

/**
 * El diagnóstico. No dice qué hacer con la mano en el hombro: dice en qué
 * percentil de su propio tramo cae cada cifra del jugador, cuánto decide cada
 * una (medido comparando ganador y perdedor dentro de la misma partida) y qué
 * hace él distinto cuando gana. Lo que no se puede sostener con la muestra que
 * hay sale marcado, no escondido.
 */
export default function PlayerAssessment({ profileId, matchType = '6' }: Props) {
  const { t } = useT();

  const { data, isLoading } = useQuery<AssessmentResponse>({
    queryKey: ['assessment', profileId, matchType],
    queryFn: () => getPlayerAssessment(profileId, { match_type: matchType }),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <p className="text-sm text-gray-500">{t('common.loading')}…</p>;
  if (!data) return null;

  if (!data.ready) {
    return (
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-4">
        <h3 className="text-base font-semibold text-gray-200 m-0 mb-2">{t('assess.title')}</h3>
        <p className="text-sm text-gray-500 m-0">{t('assess.pending')}</p>
      </div>
    );
  }

  const metrics = data.metrics ?? [];
  const verdict = data.verdict ?? [];
  const nombre = (k: string) => t(`assess.${k}` as never) || k;

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-4">
      <h3 className="text-base font-semibold text-gray-200 m-0 mb-1">{t('assess.title')}</h3>
      <p className="text-sm text-gray-400 m-0 mb-1">{t('assess.intro')}</p>
      <p className="text-xs text-gray-600 m-0">
        {t('assess.sample', {
          n: String(data.sample),
          p: String(data.bracket_players ?? 0),
          b: data.bracket ?? '',
        })}
      </p>

      {/* Con cuatro ganadas y cuatro perdidas no se le dice a nadie que
          arregle su juego. El aviso va arriba, no en una nota al pie. */}
      {data.thin && (
        <p className="text-xs text-gold-400/90 bg-gold-500/10 border border-gold-500/20 rounded-lg px-3 py-2 mt-3 m-0">
          {t('assess.thin', { n: String(data.sample), min: String(data.min_reliable ?? 10) })}
        </p>
      )}

      {/* El titular. Una tabla no es una conclusión: la mayoría de la gente
          que juega a esto no lee percentiles, lee frases. Los números van
          dentro de la frase para que no haya que buscarlos. */}
      {(() => {
        const top = verdict[0];
        const m = top ? metrics.find((x) => x.key === top.key) : null;
        if (!m) return null;
        const brecha = m.in_wins != null && m.in_losses != null
          ? Math.abs(m.lower_is_better ? m.in_losses - m.in_wins : m.in_wins - m.in_losses)
          : null;
        const separa = brecha != null && brecha >= (m.unit === 's' ? 20 : 2);
        return (
          <p className="text-[15px] leading-relaxed text-gray-200 bg-dark-800/60 border-l-2 border-red-400/60 rounded-r-lg px-4 py-3 mt-4 m-0">
            {separa
              ? t('assess.headlineSplit', {
                  metric: nombre(m.key),
                  win: formato(m, m.in_wins),
                  loss: formato(m, m.in_losses),
                  pct: String(m.percentile ?? 0),
                })
              : t('assess.headlinePlain', {
                  metric: nombre(m.key),
                  pct: String(m.percentile ?? 0),
                })}
          </p>
        );
      })()}

      {/* El detalle del veredicto, ya con la frase leída. */}
      <div className="mt-4">
        <h4 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-2">
          {t('assess.verdictTitle')}
        </h4>
        {verdict.length === 0 ? (
          <p className="text-sm text-gray-500 m-0">{t('assess.verdictNone')}</p>
        ) : (
          <ol className="list-none p-0 m-0 flex flex-col gap-2">
            {verdict.map((v, i) => {
              const m = metrics.find((x) => x.key === v.key);
              const esTiempo = m?.unit === 's';
              return (
                <li
                  key={v.key}
                  className={`flex items-baseline gap-3 rounded-lg px-3 py-2 ${
                    i === 0
                      ? 'bg-red-500/10 border border-red-500/25'
                      : 'bg-dark-800/50 border border-dark-500/40'
                  }`}
                >
                  <span className="text-xs text-gray-600 tabular-nums">{i + 1}</span>
                  <span className="flex-1">
                    <span className={`text-sm font-medium ${i === 0 ? 'text-red-300' : 'text-gray-300'}`}>
                      {nombre(v.key)}
                    </span>
                    {v.gap_to_median != null && (
                      <span className="block text-xs text-gray-500">
                        {esTiempo
                          ? t('assess.gapTime', { v: String(Math.round(v.gap_to_median)) })
                          : t('assess.gapPlain', { v: String(v.gap_to_median) })}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
                    {t('assess.percentile')} {v.percentile}%
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="mt-5 -mx-4 px-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-400">
              <th className="text-left py-2 pr-3 text-gray-500 font-medium">{t('assess.metric')}</th>
              <th className="text-right py-2 px-2 text-gray-500 font-medium">{t('assess.you')}</th>
              <th className="text-right py-2 px-2 text-gray-500 font-medium">{t('assess.median')}</th>
              <th className="text-right py-2 px-2 text-gray-500 font-medium whitespace-nowrap">
                {t('assess.percentile')}
              </th>
              <th
                className="text-right py-2 pl-2 text-gray-500 font-medium"
                title={t('assess.decidesHint')}
              >
                {t('assess.decides')}
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => {
              const bajo = m.percentile != null && m.percentile < 50;
              return (
                <tr key={m.key} className="border-b border-dark-500/40">
                  <td className="py-2.5 pr-3 text-gray-300">
                    {nombre(m.key)}
                    {/* El clic va debajo y pequeno: es lo que el jugador
                        controla, pero no es lo que se compara con una guia. */}
                    {pedida(m, m.you) && (
                      <span className="block text-[10px] text-gray-600">
                        {t('assess.requested')} {pedida(m, m.you)}
                      </span>
                    )}
                  </td>
                  <td className={`py-2.5 px-2 text-right tabular-nums font-medium ${
                    bajo ? 'text-red-300' : 'text-gray-200'
                  }`}>
                    {formato(m, m.you)}
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-gray-500">
                    {formato(m, m.bracket_median)}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {m.percentile == null ? (
                      <span className="text-gray-600">—</span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <span className="hidden sm:block w-16 h-1.5 rounded-full bg-dark-500 overflow-hidden">
                          <span
                            className={`block h-full rounded-full ${bajo ? 'bg-red-400' : 'bg-gold-400'}`}
                            style={{ width: `${m.percentile}%` }}
                          />
                        </span>
                        <span
                          className="tabular-nums text-gray-300 w-9 text-right"
                          title={t('assess.percentileHint', { pct: String(m.percentile) })}
                        >
                          {m.percentile}%
                        </span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pl-2 text-right tabular-nums text-xs text-gray-500">
                    {m.decides_pct ? `${m.decides_pct}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* El control propio del jugador: mismo jugador, mismo nivel. */}
      <div className="mt-5">
        <h4 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-1">
          {t('assess.splitTitle')}
        </h4>
        <p className="text-xs text-gray-600 m-0 mb-2">
          {t('assess.splitNote')}
          {data.wins_measured != null && data.losses_measured != null && (
            <span className="ml-1 tabular-nums">
              ({data.wins_measured}W / {data.losses_measured}L)
            </span>
          )}
        </p>
        <div className="-mx-4 px-4 overflow-x-auto">
          <table className="w-full text-sm">
            {/* La cabecera va ARRIBA y nombra las cuatro columnas. Antes la
                leyenda estaba debajo y solo etiquetaba dos de las tres de
                numeros, asi que no se sabia cual era cual. */}
            <thead>
              <tr className="border-b border-dark-400">
                <th className="text-left py-2 pr-3 text-gray-500 font-medium">
                  {t('assess.metric')}
                </th>
                <th className="text-right py-2 px-2 text-gray-500 font-medium whitespace-nowrap">
                  {t('assess.inWins')}
                </th>
                <th className="text-right py-2 px-2 text-gray-500 font-medium whitespace-nowrap">
                  {t('assess.inLosses')}
                </th>
                <th className="text-right py-2 pl-2 text-gray-500 font-medium whitespace-nowrap">
                  {t('assess.gap')}
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => {
                if (m.in_wins == null || m.in_losses == null) return null;
                //  Mejor ganando = la diferencia va en el sentido que mejora.
                const delta = m.lower_is_better
                  ? m.in_losses - m.in_wins
                  : m.in_wins - m.in_losses;
                const plano = Math.abs(delta) < (m.unit === 's' ? 10 : 1);
                return (
                  <tr key={m.key} className="border-b border-dark-500/40">
                    <td className="py-2 pr-3 text-gray-400">{nombre(m.key)}</td>
                    <td className="py-2 px-2 text-right tabular-nums text-gray-300">
                      {formato(m, m.in_wins)}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums text-gray-300">
                      {formato(m, m.in_losses)}
                    </td>
                    <td className={`py-2 pl-2 text-right tabular-nums text-xs ${
                      plano ? 'text-gray-600' : delta > 0 ? 'text-emerald-400/80' : 'text-red-400/80'
                    }`}>
                      {plano ? (
                        //  'Igual' dice algo; un simbolo matematico no.
                        <span title={t('assess.flatHint')}>{t('assess.flat')}</span>
                      ) : (
                        `${delta > 0 ? '+' : ''}${
                          m.unit === 's' ? `${Math.round(delta)}s` : delta.toFixed(1)
                        }`
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* La diferencia va siempre en el sentido que te favorece, asi que
            un numero en verde es "lo haces mejor cuando ganas" tanto si la
            cifra sube como si baja. Sin decirlo, un +19s de centro urbano
            parado se lee como 19 segundos MAS parado. */}
        <p className="text-[11px] text-gray-600 mt-2 m-0">{t('assess.gapNote')}</p>
      </div>

      <p className="text-[11px] text-gray-600 mt-4 m-0">{t('assess.ageNote')}</p>
      {data.weights_from_pairs != null && (
        <p className="text-[11px] text-gray-600 mt-1 m-0">
          {t('assess.weights', { n: data.weights_from_pairs.toLocaleString() })}
        </p>
      )}
    </div>
  );
}
