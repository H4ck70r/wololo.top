import { useQuery } from '@tanstack/react-query';
import { getLevelBenchmarks } from '../lib/api';
import { useT } from '../lib/i18n';
import { colorDeJugador, nombreDeJugador } from '../lib/jugadores';
import type { ReplayTimeline, LevelBenchmarksResponse } from '../lib/types';

interface Props {
  timeline: ReplayTimeline;
}

/**
 * El ritmo de juego.
 *
 * Dos cifras y no una: las acciones por minuto, y las EFECTIVAS. Dos órdenes
 * iguales a las mismas unidades y casi seguidas cuentan una sola, porque en
 * una pelea se repite el mismo clic de ataque muchas veces y eso infla el
 * número sin hacer nada nuevo.
 *
 * Todo va en minutos de reloj de JUEGO, que corre a 1,7x el real: es el reloj
 * que se ve en pantalla y el que usan las guías.
 *
 * El reparto entre mandar y construir va por TIPO DE COMANDO y no por tipo de
 * unidad, porque el replay no dice qué es cada objeto.
 */
export default function ReplayApm({ timeline }: Props) {
  const { t } = useT();
  const ritmo = timeline.ritmo ?? {};

  //  La referencia de su propia franja, que es lo que convierte un numero en
  //  un juicio: 40 por minuto no dice nada hasta saber que su nivel hace 32.
  const { data: referencias } = useQuery<LevelBenchmarksResponse>({
    queryKey: ['levelBenchmarks', '6'],
    queryFn: () => getLevelBenchmarks({ match_type: '6' }),
    staleTime: 30 * 60 * 1000,
  });
  const refDeFranja = (rating?: number) => {
    if (rating == null || !referencias) return null;
    const franja = rating < 1000 ? '<1000' : rating < 1200 ? '1000-1200'
      : rating < 1400 ? '1200-1400' : rating < 1600 ? '1400-1600' : '1600+';
    const b = referencias.brackets.find((x) => x.bracket === franja);
    return b && !b.thin && b.apm != null ? { franja, apm: b.apm } : null;
  };
  const colorDe = (n: number) => colorDeJugador(timeline.jugadores, n);
  const nombreJ = (n: number) => nombreDeJugador(timeline.jugadores, n);

  const series = timeline.jugadores.map((j) => {
    const s = ritmo[String(j.numero)] ?? [];
    const minutos = s.length || 1;
    const mando = s.reduce((a, x) => a + x[1], 0);
    const gestion = s.reduce((a, x) => a + x[2], 0);
    const efectivas = s.reduce((a, x) => a + (x[3] ?? 0), 0);
    const total = mando + gestion;
    return {
      numero: j.numero,
      serie: s,
      apm: Math.round(total / minutos),
      eapm: Math.round(efectivas / minutos),
      pico: s.reduce((m, x) => Math.max(m, x[3] ?? 0), 0),
      repetido: total ? Math.round(100 * (1 - efectivas / total)) : 0,
      mando, gestion, total,
    };
  }).filter((x) => x.serie.length);

  if (!series.length) return <p className="text-sm text-gray-500">{t('common.noData')}</p>;

  const techo = Math.max(1, ...series.flatMap((x) => x.serie.map((y) => y[3] ?? 0)));
  const largo = Math.max(...series.map((x) => x.serie.length));

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-1">{t('apm.title')}</h4>
      <p className="text-xs text-gray-600 m-0 mb-3">{t('apm.note')}</p>

      <div className="flex flex-col gap-3">
        {series.map((s) => (
          <div key={s.numero} className="bg-dark-800/50 border border-dark-500/40 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorDe(s.numero) }} />
              <span className="text-sm text-gray-200">{nombreJ(s.numero)}</span>
            </div>

            {/* Una frase y no cuatro numeros sueltos: lo que importa es
                cuantas ordenes utiles hizo por minuto, y si eso es mucho o
                poco para su nivel. */}
            <p className="text-[15px] text-gray-200 m-0 mb-1">
              {t('apm.frase', { total: String(s.apm), efectivas: String(s.eapm) })}
            </p>
            <p className="text-xs text-gray-500 m-0 mb-1">
              {t('apm.repetidasFrase', { n: String(s.repetido) })}
            </p>
            {(() => {
              const r = refDeFranja(timeline.jugadores.find((j) => j.numero === s.numero)?.rating);
              if (!r) return null;
              const dif = s.apm - r.apm;
              return (
                <p className="text-xs m-0 mb-3">
                  <span className={dif >= 0 ? 'text-emerald-400/90' : 'text-red-400/90'}>
                    {t(dif >= 0 ? 'apm.masQueFranja' : 'apm.menosQueFranja',
                       { n: String(Math.abs(Math.round(dif))), franja: r.franja, ref: String(Math.round(r.apm)) })}
                  </span>
                </p>
              );
            })()}

            {/* Las efectivas minuto a minuto. */}
            <div className="flex items-end gap-px h-14">
              {Array.from({ length: largo }, (_, m) => {
                const fila = s.serie.find((x) => x[0] === m);
                const v = fila ? (fila[3] ?? 0) : 0;
                return (
                  <div key={m} className="flex-1 h-full flex flex-col justify-end"
                       title={`${m}:00 · ${v}`}>
                    <span className="block w-full rounded-t-[1px]"
                          style={{ height: `${Math.max((v / techo) * 100, v ? 3 : 0)}%`,
                                   background: colorDe(s.numero) }} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
              <span>0:00</span>
              <span className="text-gray-500">{t('apm.ejeY', { pico: String(s.pico) })}</span>
              <span>{largo}:00</span>
            </div>

            {/* Mandar contra construir. */}
            <div className="mt-2">
              <div className="flex h-1.5 rounded-full overflow-hidden bg-dark-600">
                <span className="bg-gray-500" style={{ width: `${(100 * s.mando) / (s.total || 1)}%` }} />
                <span style={{ width: `${(100 * s.gestion) / (s.total || 1)}%`,
                               background: colorDe(s.numero) }} />
              </div>
              <p className="text-xs text-gray-500 mt-1 m-0">
                {t('apm.repartoFrase', {
                  mando: String(Math.round((100 * s.mando) / (s.total || 1))),
                  gestion: String(Math.round((100 * s.gestion) / (s.total || 1))),
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-600 mt-3 m-0">{t('apm.limite')}</p>
    </div>
  );
}
