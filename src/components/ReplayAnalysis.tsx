import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLevelBenchmarks } from '../lib/api';
import { useT } from '../lib/i18n';
import ReplayMap from './ReplayMap';
import ReplayUnits from './ReplayUnits';
import ReplayEconomy from './ReplayEconomy';
import ReplayApm from './ReplayApm';
import type { ReplayTimeline, TimelinePlayer, LevelBenchmarksResponse } from '../lib/types';

interface Props {
  timeline: ReplayTimeline;
  /** las cifras por jugador que saca el parser, si las hay */
  players?: Record<string, number | string | null>[];
  /** los jugadores de la cabecera, que incluyen a las IA */
  info?: { jugadores?: TimelinePlayer[] } | null;
}

const reloj = (ms: number | null | undefined) => {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

//  Lo que tarda cada investigación. Se suma al clic porque lo que usan las
//  guías y los coaches es cuándo la edad CAE.
const INVESTIGACION_MS = { feudal: 130_000, castle: 160_000, imperial: 190_000 };

type Pestana = 'unidades' | 'economia' | 'tecnologias' | 'apm';

/**
 * El análisis de una partida, en pestañas.
 *
 * Todo apilado en una columna desperdiciaba la pantalla ancha y obligaba a
 * desplazarse mucho en el móvil para llegar a lo de abajo. Con pestañas, cada
 * una contesta una pregunta y el mapa -que es lo que la gente quiere ver-
 * puede ocupar el ancho que merece.
 *
 * Lo usan la página de análisis y la ficha de partida: una sola vista, para
 * que no acaben divergiendo.
 */
/** La diferencia con la franja, bajo la cifra. Verde mejor, rojo peor. */
function Delta({ v, seg }: { v: { dif: number; mejor: boolean; franja: string } | null; seg?: boolean }) {
  const { t } = useT();
  if (!v || Math.abs(v.dif) < (seg ? 5 : 0.5)) return null;
  const n = seg ? `${Math.abs(Math.round(v.dif))}s` : Math.abs(v.dif).toFixed(1);
  return (
    <span
      className={`block text-[10px] tabular-nums ${v.mejor ? 'text-emerald-400/80' : 'text-red-400/80'}`}
      title={t('ana.vsBracket', { b: v.franja })}
    >
      {v.mejor ? '−' : '+'}{n}
    </span>
  );
}

export default function ReplayAnalysis({ timeline, players = [], info }: Props) {
  const { t } = useT();
  const [pestana, setPestana] = useState<Pestana>('unidades');

  const jugadores = info?.jugadores ?? timeline.jugadores;

  /**
   * Lo que separa esto de un analizador de partidas sueltas: cada cifra lleva
   * al lado lo que hace su propia franja de ELO, sacado de miles de partidas.
   *
   * Un analizador puede decirte que llegaste a Castillos a las 21:38. Para
   * saber si eso es bueno hace falta saber qué hacen los demás a tu nivel, y
   * eso no sale de un fichero: sale de haber medido muchos.
   *
   * El rating lo trae el propio replay en su bloque final, así que funciona
   * incluso en partidas que el ladder nunca vio.
   */
  const { data: referencias } = useQuery<LevelBenchmarksResponse>({
    queryKey: ['levelBenchmarks', '6'],
    queryFn: () => getLevelBenchmarks({ match_type: '6' }),
    staleTime: 30 * 60 * 1000,
  });

  const franjaDe = (rating?: number) => {
    if (rating == null) return null;
    if (rating < 1000) return '<1000';
    if (rating < 1200) return '1000-1200';
    if (rating < 1400) return '1200-1400';
    if (rating < 1600) return '1400-1600';
    return '1600+';
  };

  /** Cuánto mejor o peor que su franja, en segundos o en unidades. */
  const contra = (rating: number | undefined, campo: 'feudal_s' | 'castle_s' | 'villagers_15m' | 'apm',
                  valor: number | null | undefined, menorEsMejor: boolean) => {
    if (valor == null || !referencias) return null;
    const franja = franjaDe(rating);
    const b = referencias.brackets.find((x) => x.bracket === franja);
    const ref = b?.[campo];
    if (b?.thin || ref == null) return null;
    const dif = menorEsMejor ? ref - valor : valor - ref;
    return { dif, mejor: dif > 0, franja: franja! };
  };
  const PESTANAS: { id: Pestana; etiqueta: string }[] = [
    { id: 'unidades', etiqueta: t('tabs.units') },
    { id: 'economia', etiqueta: t('tabs.economy') },
    { id: 'tecnologias', etiqueta: t('tabs.techs') },
    { id: 'apm', etiqueta: t('tabs.apm') },
  ];

  return (
    <div>
      {/* El resumen va fuera de las pestañas: es la respuesta corta y se
          quiere ver siempre, sea cual sea la pestaña abierta. */}
      <div className="-mx-4 px-4 overflow-x-auto mb-4">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="border-b border-dark-400 text-gray-500">
              <th className="text-left py-2 pr-3 font-medium">·</th>
              <th className="text-left py-2 px-2 font-medium">{t('up.opening')}</th>
              <th className="text-right py-2 px-2 font-medium">{t('up.feudal')}</th>
              <th className="text-right py-2 px-2 font-medium">{t('up.castle')}</th>
              <th className="text-right py-2 px-2 font-medium">{t('up.imperial')}</th>
              {/* En móvil sobran: la comparación que importa es la de edades. */}
              <th className="text-right py-2 px-2 font-medium hidden sm:table-cell">{t('up.vils')}</th>
              <th className="text-right py-2 pl-2 font-medium hidden sm:table-cell">{t('up.apm')}</th>
            </tr>
          </thead>
          <tbody>
            {jugadores.map((j, k) => {
              const p = players.find((x) => x.profile_id === j.perfil) ?? {};
              const f = p.feudal_ms as number | null;
              const c = p.castle_ms as number | null;
              const im = p.imperial_ms as number | null;
              return (
                <tr key={k} className="border-b border-dark-500/40">
                  <td className="py-2 pr-3 text-gray-300 whitespace-nowrap">
                    {j.nombre}
                    {j.rating != null && (
                      <span className="ml-1.5 text-[10px] text-gray-500 tabular-nums">{j.rating}</span>
                    )}
                    {j.es_ia && (
                      <span className="ml-1.5 text-[10px] text-gray-500 border border-dark-400 rounded px-1">
                        {t('up.ai')}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-gray-300">{(p.opening as string) ?? '—'}</td>
                  <td className="py-2 px-2 text-right tabular-nums text-gray-300">
                    {f == null ? '—' : reloj(f + INVESTIGACION_MS.feudal)}
                    <Delta v={contra(j.rating, 'feudal_s', f == null ? null : f / 1000, true)} seg />
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-gray-300">
                    {c == null ? '—' : reloj(c + INVESTIGACION_MS.castle)}
                    <Delta v={contra(j.rating, 'castle_s', c == null ? null : c / 1000, true)} seg />
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-gray-300">
                    {im == null ? '—' : reloj(im + INVESTIGACION_MS.imperial)}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums text-gray-300 hidden sm:table-cell">
                    {(p.villagers_15m as number) ?? '—'}
                    <Delta v={contra(j.rating, 'villagers_15m', p.villagers_15m as number, false)} />
                  </td>
                  <td className="py-2 pl-2 text-right tabular-nums text-gray-300 hidden sm:table-cell">
                    {(p.apm as number) ?? '—'}
                    <Delta v={contra(j.rating, 'apm', p.apm as number, false)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* El mapa manda y no se va nunca: es lo que la gente quiere mirar, y
          cambiar de pestaña no deberia hacerlo desaparecer. En pantalla ancha
          va a la izquierda con el detalle al lado; por debajo de lg se apilan,
          con el mapa primero. */}
      <div className="grid gap-4 items-start lg:grid-cols-[minmax(0,1.3fr)_20rem] xl:grid-cols-[minmax(0,1.5fr)_24rem]">
        <div className="min-w-0">
          <ReplayMap timeline={timeline} />
        </div>

        <div className="min-w-0">
          {/* La barra se desplaza en horizontal en pantallas estrechas en vez
              de partirse en dos filas. */}
          <div className="flex items-center gap-1 border-b border-dark-400 overflow-x-auto mb-3">
            {PESTANAS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPestana(p.id)}
                className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  pestana === p.id
                    ? 'border-gold-400 text-gold-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {p.etiqueta}
              </button>
            ))}
          </div>

          {/* Altura acotada con desplazamiento propio: el panel no puede
              estirar la pagina hasta dejar el mapa fuera de pantalla, que es
              justo lo que se quiere evitar. */}
          {/* Altura fija y no solo maxima: con max-h la tarjeta se encogia y
              crecia al cambiar de pestaña, y una caja que salta de tamaño se
              lee como algo a medio hacer. */}
          <div className="lg:h-[34rem] lg:overflow-y-auto pr-1">
            {pestana === 'unidades' && <ReplayUnits timeline={timeline} soloUnidades />}
            {pestana === 'economia' && <ReplayEconomy timeline={timeline} players={players} />}
            {pestana === 'tecnologias' && <ReplayUnits timeline={timeline} soloTecnologias />}
            {pestana === 'apm' && <ReplayApm timeline={timeline} />}
          </div>
        </div>
      </div>
    </div>
  );
}
