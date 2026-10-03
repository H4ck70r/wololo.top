import { useT } from '../lib/i18n';
import { colorDeJugador, nombreDeJugador } from '../lib/jugadores';
import type { ReplayTimeline } from '../lib/types';

interface Props {
  timeline: ReplayTimeline;
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
export default function ReplayEconomy({ timeline }: Props) {
  const { t, lang } = useT();
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

      <h4 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-1">
        {t('eco.rhythmTitle')}
      </h4>
      <p className="text-xs text-gray-600 m-0 mb-3">{t('eco.rhythmNote')}</p>

      <div className="flex flex-col gap-3">
        {jugadores.map((j) => {
          const serie = ritmo[String(j)] ?? [];
          const mando = serie.reduce((s, x) => s + x[1], 0);
          const gestion = serie.reduce((s, x) => s + x[2], 0);
          const total = mando + gestion || 1;
          const minutos = serie.length ? serie[serie.length - 1][0] + 1 : 1;
          return (
            <div key={j}>
              <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorDe(j) }} />
                <span className="text-sm text-gray-200">{nombreJ(j)}</span>
                <span className="text-xs text-gray-500 tabular-nums ml-auto">
                  {Math.round(total / minutos)} {t('eco.perMinute')}
                </span>
              </div>
              <div className="flex items-end gap-px h-12">
                {Array.from({ length: minutos }, (_, m) => {
                  const fila = serie.find((x) => x[0] === m);
                  const a = fila ? fila[1] : 0;
                  const b = fila ? fila[2] : 0;
                  return (
                    <div key={m} className="flex-1 h-full flex flex-col justify-end"
                         title={`${m}:00 · ${a + b}`}>
                      <span className="block w-full bg-gray-500/70"
                            style={{ height: `${(a / techo) * 100}%` }} />
                      <span className="block w-full" style={{
                        height: `${(b / techo) * 100}%`, background: colorDe(j),
                      }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
                <span>{t('eco.command')} {Math.round((100 * mando) / total)}%</span>
                <span>{t('eco.manage')} {Math.round((100 * gestion) / total)}%</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-600 mt-3 m-0">{lang === 'es' ? '' : ''}</p>
    </div>
  );
}
