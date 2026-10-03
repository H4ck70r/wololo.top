import { useMemo } from 'react';
import { useT } from '../lib/i18n';
import { nombreUnidad, claseDe, CLASE_COLOR } from '../lib/units';
import type { ReplayTimeline } from '../lib/types';

interface Props {
  timeline: ReplayTimeline;
}

const COLORES = ['#8b8b8b', '#4a7fd4', '#d44a4a', '#3fa64f', '#d9c13c',
                 '#3fb8bd', '#9a56c4', '#9a9a9a', '#dd8b35'];

//  Cubos de tres minutos y medio: suficientes para ver el ritmo sin que cada
//  barra sea una sola unidad.
const CUBO_MS = 210_000;
const ALDEANO = 83;

const reloj = (ms: number) =>
  `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

/**
 * Qué encargó cada jugador y cuándo.
 *
 * Importante y va dicho en la tarjeta: esto es lo que se ENCOLÓ, no lo que
 * llegó a existir. Si alguien pide cinco scouts y le tiran el establo, el
 * replay dice que los pidió. El fichero registra órdenes, no estado.
 */
export default function ReplayUnits({ timeline }: Props) {
  const { t, lang } = useT();

  const datos = useMemo(() => {
    const porJugador = new Map<number, {
      total: Map<number, number>;
      cubos: Map<number, Map<number, number>>;
    }>();
    let maxCubo = 0;
    for (const e of timeline.eventos) {
      if (e.tipo !== 'queue' || e.id == null) continue;
      const n = e.n ?? 1;
      if (!porJugador.has(e.j)) porJugador.set(e.j, { total: new Map(), cubos: new Map() });
      const d = porJugador.get(e.j)!;
      d.total.set(e.id, (d.total.get(e.id) ?? 0) + n);
      const cubo = Math.floor(e.t / CUBO_MS);
      if (!d.cubos.has(cubo)) d.cubos.set(cubo, new Map());
      const c = d.cubos.get(cubo)!;
      c.set(e.id, (c.get(e.id) ?? 0) + n);
      if (cubo > maxCubo) maxCubo = cubo;
    }
    //  La escala la marca el cubo más cargado de militar de cualquiera, para
    //  que las dos filas se puedan comparar a ojo.
    let techo = 1;
    for (const d of porJugador.values()) {
      for (const c of d.cubos.values()) {
        let mil = 0;
        for (const [id, n] of c) if (id !== ALDEANO) mil += n;
        if (mil > techo) techo = mil;
      }
    }
    return { porJugador, maxCubo, techo };
  }, [timeline]);

  const colorJ = (numero: number) => {
    const j = timeline.jugadores.find((x) => x.numero === numero);
    return COLORES[(j?.color ?? numero) % COLORES.length];
  };
  const nombreJ = (numero: number) =>
    timeline.jugadores.find((x) => x.numero === numero)?.nombre ?? `#${numero}`;

  const jugadores = [...datos.porJugador.keys()].sort((a, b) => a - b);
  if (!jugadores.length) return null;

  return (
    <div className="mt-5">
      <h4 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-1">
        {t('units.title')}
      </h4>
      <p className="text-xs text-gray-600 m-0 mb-3">{t('units.note')}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {jugadores.map((j) => {
          const d = datos.porJugador.get(j)!;
          const lista = [...d.total.entries()]
            .filter(([id]) => id !== ALDEANO)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 7);
          const aldeanos = d.total.get(ALDEANO) ?? 0;
          const maxLista = lista.length ? lista[0][1] : 1;
          return (
            <div key={j} className="bg-dark-800/50 border border-dark-500/40 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorJ(j) }} />
                <span className="text-sm font-medium text-gray-200">{nombreJ(j)}</span>
                <span className="text-xs text-gray-500 ml-auto tabular-nums">
                  {aldeanos} {t('units.vils')}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {lista.map(([id, n]) => (
                  <div key={id} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-28 truncate" title={nombreUnidad(id, lang)}>
                      {nombreUnidad(id, lang)}
                    </span>
                    <span className="flex-1 h-2 rounded-full bg-dark-600 overflow-hidden">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${(n / maxLista) * 100}%`, background: CLASE_COLOR[claseDe(id)] }}
                      />
                    </span>
                    <span className="text-xs tabular-nums text-gray-300 w-7 text-right">{n}</span>
                  </div>
                ))}
                {!lista.length && (
                  <p className="text-xs text-gray-600 m-0">{t('units.onlyVils')}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h5 className="text-xs uppercase tracking-wide text-gray-500 mt-5 mb-2">
        {t('units.overTime')}
      </h5>
      <div className="flex flex-col gap-2">
        {jugadores.map((j) => {
          const d = datos.porJugador.get(j)!;
          return (
            <div key={j}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-sm" style={{ background: colorJ(j) }} />
                <span className="text-xs text-gray-400">{nombreJ(j)}</span>
              </div>
              <div className="flex items-end gap-px h-16">
                {Array.from({ length: datos.maxCubo + 1 }, (_, k) => {
                  const c = d.cubos.get(k);
                  const porClase = new Map<string, number>();
                  let mil = 0;
                  if (c) {
                    for (const [id, n] of c) {
                      if (id === ALDEANO) continue;
                      const cl = claseDe(id);
                      porClase.set(cl, (porClase.get(cl) ?? 0) + n);
                      mil += n;
                    }
                  }
                  return (
                    <div
                      key={k}
                      className="flex-1 flex flex-col justify-end"
                      title={`${reloj(k * CUBO_MS)} – ${reloj((k + 1) * CUBO_MS)}: ${mil}`}
                    >
                      {[...porClase.entries()].map(([cl, n]) => (
                        <span
                          key={cl}
                          className="block w-full"
                          style={{
                            height: `${(n / datos.techo) * 100}%`,
                            background: CLASE_COLOR[cl as keyof typeof CLASE_COLOR],
                          }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
        <span>0:00</span>
        <span>{reloj(timeline.duracion_ms)}</span>
      </div>
      {/* Sin leyenda las barras de colores son adorno. */}
      <div className="flex gap-x-3 gap-y-1 mt-2 flex-wrap">
        {(['inf', 'tiro', 'cab', 'asedio', 'otros'] as const).map((cl) => (
          <span key={cl} className="flex items-center gap-1 text-[11px] text-gray-500">
            <span className="w-2 h-2 rounded-sm" style={{ background: CLASE_COLOR[cl] }} />
            {t(`units.class.${cl}` as never)}
          </span>
        ))}
      </div>
    </div>
  );
}
