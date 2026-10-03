import { useT } from '../lib/i18n';
import type { MatchDetailPlayer } from '../lib/types';

interface Props {
  players: MatchDetailPlayer[];
}

/** El reloj de JUEGO, que es el que ve el jugador en pantalla. */
function reloj(ms: number | null | undefined) {
  if (ms == null) return null;
  const s = Math.round(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Lo que sale del replay de la partida. Solo aparece cuando hay datos: Relic
 * borra los replays al cabo de un ano, asi que la mayoria de las partidas
 * viejas nunca los tendra, y una tarjeta vacia no aporta nada.
 */
export default function ReplayInsights({ players }: Props) {
  const { t } = useT();
  const conDatos = players.filter((p) => p.replay);
  if (conDatos.length === 0) return null;

  const filas: { clave: string; etiqueta: string; valor: (p: MatchDetailPlayer) => string | null;
                 mejorBajo?: boolean }[] = [
    { clave: 'opening', etiqueta: t('replay.opening'), valor: (p) => p.replay?.opening ?? null },
    { clave: 'feudal', etiqueta: t('replay.feudal'), valor: (p) => reloj(p.replay?.feudal_ms), mejorBajo: true },
    { clave: 'castle', etiqueta: t('replay.castle'), valor: (p) => reloj(p.replay?.castle_ms), mejorBajo: true },
    { clave: 'imperial', etiqueta: t('replay.imperial'), valor: (p) => reloj(p.replay?.imperial_ms), mejorBajo: true },
    { clave: 'vills', etiqueta: t('replay.villagers'), valor: (p) => p.replay?.villagers_15m?.toString() ?? null },
    { clave: 'idle', etiqueta: t('replay.tcIdle'), valor: (p) =>
        p.replay?.tc_idle_ms == null ? null : `${Math.round(p.replay.tc_idle_ms / 1000)}s`, mejorBajo: true },
    { clave: 'apm', etiqueta: t('replay.apm'), valor: (p) => p.replay?.apm?.toFixed(0) ?? null },
  ];

  //  Comparar los dos lados es lo que convierte un dato en una lectura: 165
  //  segundos de centro urbano parado no dicen nada hasta que enfrente hay un 3.
  const esDuelo = conDatos.length === 2;

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5 mb-6">
      <div className="flex items-baseline gap-2 mb-1 flex-wrap">
        <h2 className="text-lg font-semibold text-gray-200 m-0">{t('replay.title')}</h2>
        <span className="text-xs text-gray-500">{t('replay.subtitle')}</span>
      </div>

      <div className="overflow-x-auto mt-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-400">
              <th className="text-left py-2 pr-3 text-gray-500 font-medium text-xs uppercase tracking-wide">
                {t('replay.metric')}
              </th>
              {conDatos.map((p) => (
                <th key={p.profile_id} className="text-right py-2 pl-3 text-gray-300 font-medium">
                  <span className="truncate inline-block max-w-[9rem] align-bottom">
                    {p.alias || `#${p.profile_id}`}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => {
              const valores = conDatos.map(fila.valor);
              if (valores.every((v) => v == null)) return null;
              //  Solo se marca el mejor en un duelo y cuando los dos tienen dato:
              //  destacar a uno porque al otro le falta el numero seria mentir.
              let mejor = -1;
              if (esDuelo && fila.mejorBajo && valores[0] && valores[1] && valores[0] !== valores[1]) {
                mejor = valores[0]! < valores[1]! ? 0 : 1;
              }
              return (
                <tr key={fila.clave} className="border-b border-dark-500/40">
                  <td className="py-2 pr-3 text-gray-500 text-xs">{fila.etiqueta}</td>
                  {valores.map((v, i) => (
                    <td key={i} className={`py-2 pl-3 text-right tabular-nums ${
                      i === mejor ? 'text-green-400 font-semibold' : 'text-gray-300'
                    }`}>
                      {v ?? <span className="text-gray-600">—</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-600 mt-3 m-0">{t('replay.footnote')}</p>
    </div>
  );
}
