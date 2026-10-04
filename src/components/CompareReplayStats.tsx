import { useQuery } from '@tanstack/react-query';
import { getPlayerAssessment } from '../lib/api';
import { useT } from '../lib/i18n';
import type { AssessmentResponse, AssessmentMetric } from '../lib/types';
import Nota from './Nota';

interface Props {
  p1: { profile_id: number; alias: string } | null;
  p2: { profile_id: number; alias: string } | null;
}

/** Las mismas seis que usa el análisis de partida, en el mismo orden. */
const ORDEN = ['feudal_ms', 'castle_ms', 'imperial_ms', 'villagers_15m', 'tc_idle_ms', 'apm'];

const reloj = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/**
 * Cómo juega cada uno, de los replays.
 *
 * La página comparaba rating, partidas y porcentajes: lo mismo que puede sacar
 * cualquiera de la API pública. Esto es lo único que no tiene nadie más, y es
 * además lo que de verdad distingue a dos jugadores del mismo rating.
 *
 * La mediana de la franja va EN MEDIO y no de adorno: sin ella, 419s contra
 * 415s de Feudal parecen distintos, y puestos al lado de los 488s que hace la
 * franja se ve que los dos van muy por delante y que esa diferencia es ruido.
 */
export default function CompareReplayStats({ p1, p2 }: Props) {
  const { t } = useT();

  const a1 = useQuery<AssessmentResponse>({
    queryKey: ['assessment', p1?.profile_id],
    queryFn: () => getPlayerAssessment(p1!.profile_id),
    enabled: !!p1?.profile_id,
    staleTime: 10 * 60 * 1000,
  });
  const a2 = useQuery<AssessmentResponse>({
    queryKey: ['assessment', p2?.profile_id],
    queryFn: () => getPlayerAssessment(p2!.profile_id),
    enabled: !!p2?.profile_id,
    staleTime: 10 * 60 * 1000,
  });

  if (!p1 || !p2) return null;
  if (a1.isLoading || a2.isLoading) return null;

  const d1 = a1.data;
  const d2 = a2.data;
  const metricas1 = d1?.metrics ?? [];
  const metricas2 = d2?.metrics ?? [];
  if (!metricas1.length && !metricas2.length) return null;

  const de = (ms: AssessmentMetric[], clave: string) => ms.find((m) => m.key === clave);
  const franja = d1?.bracket ?? d2?.bracket ?? null;

  /** El valor tal y como se lee: los tiempos de edad llevan su investigación. */
  const pinta = (m: AssessmentMetric | undefined, v: number | null | undefined) => {
    if (m == null || v == null) return '—';
    if (m.unit === 's' && m.research_s != null) return reloj(v + m.research_s);
    if (m.unit === 's') return `${Math.round(v)}s`;
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  };

  const etiqueta = (clave: string) =>
    t(`assess.${clave}` as Parameters<typeof t>[0]);

  const corta = (d?: AssessmentResponse) =>
    !!d && (d.thin || (d.sample ?? 0) < (d.min_reliable ?? 10));

  const cabecera = (d: AssessmentResponse | undefined, nombre: string, color: string) => (
    <div className="min-w-0">
      <p className={`m-0 text-sm font-semibold truncate ${color}`}>{nombre}</p>
      {d?.sample ? (
        <p className={`m-0 text-[11px] ${corta(d) ? 'text-amber-400/80' : 'text-gray-600'}`}>
          {corta(d)
            ? t('vs.muestraCorta', { n: d.sample })
            : t('vs.muestra', { n: d.sample })}
        </p>
      ) : (
        <p className="m-0 text-[11px] text-gray-600">—</p>
      )}
    </div>
  );

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5 mb-6">
      <h2 className="flex items-center gap-1.5 text-lg font-semibold text-gray-200 mb-1 m-0">
        {t('vs.title')}
        <Nota>{t('vs.nota')}</Nota>
      </h2>
      {franja && (
        <p className="text-xs text-gray-600 m-0 mb-4">{t('vs.franja', { franja })}</p>
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-1 items-end mb-3">
        {cabecera(d1, p1.alias, 'text-gold-400')}
        <span />
        <div className="text-right">{cabecera(d2, p2.alias, 'text-blue-400')}</div>
      </div>

      {!metricas1.length || !metricas2.length ? (
        <p className="text-sm text-gray-500 m-0">{t('vs.sinDatos')}</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {ORDEN.map((clave) => {
            const m1 = de(metricas1, clave);
            const m2 = de(metricas2, clave);
            if (!m1 && !m2) return null;
            const ref = m1 ?? m2!;
            const v1 = m1?.you ?? null;
            const v2 = m2?.you ?? null;

            //  Aquí comparar SÍ tiene sentido, al revés que con las partidas
            //  jugadas: son ritmos, no volumen. Pero no se marca nada si a
            //  alguno de los dos le falta el dato o si su muestra es una
            //  anécdota, que es como decirlo sin medirlo.
            let g1 = false;
            let g2 = false;
            if (v1 != null && v2 != null && v1 !== v2 && !corta(d1) && !corta(d2)) {
              const menorMejor = ref.lower_is_better;
              g1 = menorMejor ? v1 < v2 : v1 > v2;
              g2 = !g1;
            }

            return (
              <div key={clave} className="grid grid-cols-[1fr_auto_1fr] gap-x-3 items-center py-1.5 border-b border-dark-500/40 last:border-0">
                <span className={`text-sm tabular-nums ${g1 ? 'text-win font-medium' : 'text-gray-300'}`}>
                  {pinta(m1, v1)}
                </span>
                <span className="text-center">
                  <span className="block text-[11px] text-gray-500 whitespace-nowrap">{etiqueta(clave)}</span>
                  {ref.bracket_median != null && (
                    <span className="block text-[10px] text-gray-600 tabular-nums">
                      {pinta(ref, ref.bracket_median)}
                    </span>
                  )}
                </span>
                <span className={`text-sm tabular-nums text-right ${g2 ? 'text-win font-medium' : 'text-gray-300'}`}>
                  {pinta(m2, v2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
