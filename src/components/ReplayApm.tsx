import { useT } from '../lib/i18n';
import { colorDeJugador, nombreDeJugador } from '../lib/jugadores';
import type { ReplayTimeline } from '../lib/types';

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

            <div className="grid grid-cols-4 gap-2 mb-3">
              {([['apm.apm', s.apm], ['apm.eapm', s.eapm],
                 ['apm.peak', s.pico], ['apm.repeated', `${s.repetido}%`]] as const).map(([k, v]) => (
                <div key={k} className="text-center">
                  <div className="text-base tabular-nums text-gray-100">{v}</div>
                  <div className="text-[10px] text-gray-500 leading-tight">{t(k as never)}</div>
                </div>
              ))}
            </div>

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
              <span>{largo}:00</span>
            </div>

            {/* Mandar contra construir. */}
            <div className="mt-2">
              <div className="flex h-1.5 rounded-full overflow-hidden bg-dark-600">
                <span className="bg-gray-500" style={{ width: `${(100 * s.mando) / (s.total || 1)}%` }} />
                <span style={{ width: `${(100 * s.gestion) / (s.total || 1)}%`,
                               background: colorDe(s.numero) }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                <span>{t('eco.command')} {Math.round((100 * s.mando) / (s.total || 1))}%</span>
                <span>{t('eco.manage')} {Math.round((100 * s.gestion) / (s.total || 1))}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-600 mt-3 m-0">{t('apm.limite')}</p>
    </div>
  );
}
