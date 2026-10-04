import { useT } from '../lib/i18n';
import { colorDeJugador, nombreDeJugador } from '../lib/jugadores';
import type { ReplayTimeline } from '../lib/types';
import { nombreTecnologia } from '../lib/juego';

interface Props {
  timeline: ReplayTimeline;
  /** las cifras por jugador que saca el parser */
  players?: Record<string, number | string | null>[];
}

const RECURSOS = ['comida', 'madera', 'piedra', 'oro'] as const;

/**
 * El mercado y el reparto de la atención.
 *
 * El mercado sale de las órdenes de compra y venta, y cada una mueve 100
 * unidades: comprobado contra otro analizador sobre la misma partida, siete
 * compras de comida son +700 y doce ventas son −1.200, idéntico.
 *
 * El reparto de atención va por TIPO DE COMANDO, no por tipo de unidad: el
 * replay no dice qué es cada objeto, así que un movimiento puede ser de un
 * caballero o de un aldeano. Se dice en la tarjeta para no vender otra cosa.
 */
export default function ReplayEconomy({ timeline, players = [] }: Props) {
  const { t, lang } = useT();
  const colorDe = (numero: number) => colorDeJugador(timeline.jugadores, numero);
  const nombreJ = (numero: number) => nombreDeJugador(timeline.jugadores, numero);
  const mercado = timeline.mercado ?? {};
  const ritmo = timeline.ritmo ?? {};


  const ALDEANO = 83;
  const GRANJA = 50;
  //  Las mejoras que mueven la economia, en el orden en que se piden. Los ids
  //  salen de los ficheros del propio juego, no de una lista a mano.
  const MEJORAS = [22, 213, 249, 202, 203, 221, 14, 13, 12, 55, 182, 278, 279];
  const EDADES: Record<number, string> = { 101: 'F', 102: 'C', 103: 'I' };
  const reloj = (ms: number) => {
    const seg = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
  };

  const minutos = Math.max(1, Math.ceil(timeline.duracion_ms / 60_000));

  //  Aldeanos encolados por minuto. El hueco es lo que se busca: un minuto a
  //  cero es el centro urbano parado, y eso ya sale en numero arriba; aqui se
  //  ve DONDE paso, que es lo unico que permite corregirlo.
  const porMinuto = new Map<number, number[]>();
  const edadesDe = new Map<number, { t: number; etiqueta: string }[]>();
  const granjas = new Map<number, number[]>();
  for (const j of timeline.jugadores.map((x) => x.numero)) {
    porMinuto.set(j, new Array(minutos).fill(0));
    edadesDe.set(j, []);
    granjas.set(j, []);
  }
  for (const e of timeline.eventos) {
    const m = Math.min(minutos - 1, Math.floor(e.t / 60_000));
    if (e.tipo === 'queue' && e.id === ALDEANO) {
      const fila = porMinuto.get(e.j);
      if (fila) fila[m] += e.n ?? 1;
    } else if (e.tipo === 'build' && e.id === GRANJA) {
      granjas.get(e.j)?.push(e.t);
    } else if (e.tipo === 'tech' && e.id != null && EDADES[e.id]) {
      const lista = edadesDe.get(e.j);
      if (lista && !lista.some((x) => x.etiqueta === EDADES[e.id!])) {
        lista.push({ t: e.t, etiqueta: EDADES[e.id] });
      }
    }
  }
  //  Tomas cada 5 minutos, acumulando. Es la pregunta que de verdad se hace
  //  uno -como iba la economia a cada altura- y la unica forma honesta de
  //  responderla con un fichero que no sabe de muertes.
  const PASO_MIN = 5;
  const marcas: number[] = [];
  for (let m = PASO_MIN; m <= minutos; m += PASO_MIN) marcas.push(m);
  if (marcas[marcas.length - 1] !== minutos) marcas.push(minutos);
  const curva = new Map<number, number[]>();
  for (const [j, fila] of porMinuto) {
    let suma = 0;
    let i = 0;
    const puntos: number[] = [];
    for (const m of marcas) {
      while (i < m && i < fila.length) { suma += fila[i]; i += 1; }
      puntos.push(suma);
    }
    curva.set(j, puntos);
  }

  let techoVill = 1;
  for (const fila of porMinuto.values()) for (const v of fila) techoVill = Math.max(techoVill, v);

  //  Cuando se pidio cada mejora. Solo la primera vez: se puede encolar y
  //  cancelar, y la que cuenta es la que la puso en marcha.
  const mejorasDe = new Map<number, Map<number, number>>();
  for (const e of timeline.eventos) {
    if (e.tipo !== 'tech' || e.id == null || !MEJORAS.includes(e.id)) continue;
    const m = mejorasDe.get(e.j) ?? new Map<number, number>();
    if (!m.has(e.id)) m.set(e.id, e.t);
    mejorasDe.set(e.j, m);
  }
  //  Solo se listan las que alguien pidio: una tabla con trece filas vacias no
  //  dice nada.
  const mejorasUsadas = MEJORAS.filter((id) =>
    [...mejorasDe.values()].some((m) => m.has(id)));

  const jugadores = timeline.jugadores.map((j) => j.numero);
  const hayMercado = Object.values(mercado).some((r) =>
    Object.values(r).some((v) => v.compra || v.venta));

  //  La escala del gráfico de ritmo, común a los dos para poder compararlos.
  let techo = 1;
  for (const serie of Object.values(ritmo)) {
    for (const [, mando, gestion] of serie) techo = Math.max(techo, mando + gestion);
  }

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-1">
        {t('eco.villTitle')}
      </h4>
      <p className="text-xs text-gray-600 m-0 mb-3">{t('eco.villNote')}</p>
      <div className="flex flex-col gap-2 mb-6">
        {timeline.jugadores.map((j) => {
          const p = players.find((x) => x.profile_id === j.perfil) ?? {};
          //  Aldeanos encolados en toda la partida y centros urbanos extra,
          //  los dos salen de los comandos.
          const aldeanos = timeline.eventos.filter(
            (e) => e.tipo === 'queue' && e.id === 83 && e.j === j.numero
          ).reduce((n, e) => n + (e.n ?? 1), 0);
          const tcs = timeline.eventos.filter(
            (e) => e.tipo === 'build' && e.id === 621 && e.j === j.numero
          );
          const idle = p.tc_idle_ms as number | null;
          return (
            <div key={j.numero} className="bg-dark-800/50 border border-dark-500/40 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorDe(j.numero) }} />
                <span className="text-sm text-gray-200">{j.nombre}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <span className="text-gray-500">{t('eco.villQueued')}</span>
                <span className="tabular-nums text-gray-200 text-right">{aldeanos}</span>
                <span className="text-gray-500">{t('eco.vill15')}</span>
                <span className="tabular-nums text-gray-200 text-right">
                  {(p.villagers_15m as number) ?? '—'}
                </span>
                <span className="text-gray-500">{t('eco.tcIdle')}</span>
                <span className="tabular-nums text-gray-200 text-right">
                  {idle == null ? '—' : `${Math.round(idle / 1000)}s`}
                </span>
                <span className="text-gray-500">{t('eco.extraTcs')}</span>
                <span className="tabular-nums text-gray-200 text-right">
                  {tcs.length}
                  {tcs.length > 0 && (
                    <span className="text-gray-600 ml-1">
                      ({tcs.map((e) => `${Math.floor(e.t / 60000)}′`).join(' ')})
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Las tomas cada 5 minutos. Una tabla y no un grafico: con dos
          jugadores lo que se quiere es restar una cifra de la otra, y para eso
          los numbers pegados ganan a dos lineas de colores. */}
      <h4 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-1">
        {t('eco.curva')}
      </h4>
      <p className="text-xs text-gray-600 m-0 mb-3">{t('eco.curvaNota')}</p>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-400 text-gray-500">
              <th className="text-left py-2 pr-2 font-medium" />
              {marcas.map((m) => (
                <th key={m} className="text-right py-2 pl-2 font-medium tabular-nums whitespace-nowrap">
                  {m}′
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jugadores.map((j) => {
              const puntos = curva.get(j) ?? [];
              return (
                <tr key={j} className="border-b border-dark-500/40">
                  <td className="py-2 pr-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: colorDe(j) }} />
                      <span className="text-xs text-gray-300 truncate">{nombreJ(j)}</span>
                    </span>
                  </td>
                  {puntos.map((v, i) => (
                    <td key={i} className="py-2 pl-2 text-right tabular-nums text-gray-200">{v}</td>
                  ))}
                </tr>
              );
            })}
            {/* La resta, que es lo que se mira: quien iba por delante y cuanto. */}
            {jugadores.length === 2 && (
              <tr className="text-gray-500">
                <td className="py-2 pr-2 text-xs">Δ</td>
                {marcas.map((_, i) => {
                  const a = curva.get(jugadores[0])?.[i] ?? 0;
                  const b = curva.get(jugadores[1])?.[i] ?? 0;
                  const d = a - b;
                  return (
                    <td key={i} className={`py-2 pl-2 text-right tabular-nums text-xs ${
                      d === 0 ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {d === 0 ? '—' : `${d > 0 ? '+' : ''}${d}`}
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Y el minuto a minuto, que es donde se ve el hueco. */}
      <h4 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-1">
        {t('eco.vilsOverTime')}
      </h4>
      <p className="text-xs text-gray-600 m-0 mb-3">{t('eco.vilsOverTimeNote')}</p>
      <div className="flex flex-col gap-3 mb-6">
        {jugadores.map((j) => {
          const fila = porMinuto.get(j) ?? [];
          const edades = edadesDe.get(j) ?? [];
          return (
            <div key={j}>
              <span className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-sm" style={{ background: colorDe(j) }} />
                <span className="text-xs text-gray-300">{nombreJ(j)}</span>
              </span>
              <div className="relative">
                <div className="flex items-end gap-px h-16">
                  {fila.map((v, m) => (
                    <div
                      key={m}
                      className="flex-1 rounded-sm"
                      style={{
                        height: `${Math.max(2, (v / techoVill) * 100)}%`,
                        background: v === 0 ? 'rgba(255,255,255,0.06)' : colorDe(j),
                        opacity: v === 0 ? 1 : 0.8,
                      }}
                      title={`${m}′–${m + 1}′: ${v}`}
                    />
                  ))}
                </div>
                {/* Las edades encima: un hueco justo en el clic de edad no es
                    lo mismo que un hueco a mitad de Feudal. */}
                <div className="relative h-3 pointer-events-none">
                  {edades.map((e, i) => (
                    <span
                      key={i}
                      className="absolute text-[9px] -translate-x-1/2 tabular-nums"
                      style={{ left: `${(e.t / timeline.duracion_ms) * 100}%`, color: colorDe(j) }}
                      title={reloj(e.t)}
                    >
                      {e.etiqueta}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Las mejoras. Solo se listan las que alguien pidio. */}
      {mejorasUsadas.length > 0 && (
        <>
          <h4 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-1">
            {t('eco.upgrades')}
          </h4>
          <p className="text-xs text-gray-600 m-0 mb-3">{t('eco.upgradesNote')}</p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-400 text-gray-500">
                  <th className="text-left py-2 pr-2 font-medium" />
                  {jugadores.map((j) => (
                    <th key={j} className="text-right py-2 pl-2 font-medium">
                      <span className="flex items-center justify-end gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: colorDe(j) }} />
                        <span className="text-xs text-gray-300 truncate">{nombreJ(j)}</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mejorasUsadas.map((id) => (
                  <tr key={id} className="border-b border-dark-500/40">
                    <td className="py-2 pr-2 text-xs text-gray-400">{nombreTecnologia(id, lang)}</td>
                    {jugadores.map((j) => {
                      const cuando = mejorasDe.get(j)?.get(id);
                      return (
                        <td key={j} className={`py-2 pl-2 text-right tabular-nums ${
                          cuando == null ? 'text-gray-600' : 'text-gray-200'
                        }`}>
                          {cuando == null ? t('eco.never') : reloj(cuando)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-b border-dark-500/40">
                  <td className="py-2 pr-2 text-xs text-gray-400">{t('eco.farms')}</td>
                  {jugadores.map((j) => {
                    const g = granjas.get(j) ?? [];
                    return (
                      <td key={j} className="py-2 pl-2 text-right tabular-nums text-gray-200">
                        {g.length}
                        {g.length > 0 && (
                          <span className="block text-[10px] text-gray-600">
                            {t('eco.firstFarm', { v: reloj(g[0]) })}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      <h4 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-1">
        {t('eco.marketTitle')}
      </h4>
      <p className="text-xs text-gray-600 m-0 mb-3">{t('eco.marketNote')}</p>

      {!hayMercado ? (
        <p className="text-sm text-gray-500 m-0 mb-5">{t('eco.noMarket')}</p>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {jugadores.map((j) => {
            const r = mercado[String(j)] ?? {};
            return (
              <div key={j} className="bg-dark-800/50 border border-dark-500/40 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorDe(j) }} />
                  <span className="text-sm text-gray-200">{nombreJ(j)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  {RECURSOS.map((rec) => {
                    const v = r[rec];
                    if (!v || (!v.compra && !v.venta)) return null;
                    return (
                      <div key={rec} className="flex items-baseline gap-2 text-xs">
                        <span className="text-gray-400 w-16 capitalize">
                          {t(`eco.res.${rec}` as never)}
                        </span>
                        <span className="tabular-nums text-emerald-400/90 w-16 text-right">
                          {v.compra ? `+${v.compra}` : ''}
                        </span>
                        <span className="tabular-nums text-red-400/90 w-16 text-right">
                          {v.venta ? `−${v.venta}` : ''}
                        </span>
                      </div>
                    );
                  })}
                  {!Object.values(r).some((v) => v.compra || v.venta) && (
                    <span className="text-xs text-gray-600">{t('eco.noTrades')}</span>
                  )}
                </div>
              </div>
            );
          })}
          <div className="flex gap-2 text-[10px] text-gray-600 justify-end pr-3">
            <span className="text-emerald-400/70">{t('eco.bought')}</span>
            <span className="text-red-400/70">{t('eco.sold')}</span>
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-600 mt-4 m-0">{t('eco.limite')}</p>
    </div>
  );
}
