import { useT } from '../lib/i18n';
import { colorDeJugador, nombreDeJugador } from '../lib/jugadores';
import type { ReplayTimeline } from '../lib/types';

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
  const { t } = useT();
  const colorDe = (numero: number) => colorDeJugador(timeline.jugadores, numero);
  const nombreJ = (numero: number) => nombreDeJugador(timeline.jugadores, numero);
  const mercado = timeline.mercado ?? {};
  const ritmo = timeline.ritmo ?? {};


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
