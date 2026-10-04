import { useQuery } from '@tanstack/react-query';
import { getLevelBenchmarks } from '../lib/api';
import { useT } from '../lib/i18n';
import { colorDeJugador } from '../lib/jugadores';
import type { ReplayTimeline, LevelBenchmarksResponse } from '../lib/types';

interface Props {
  timeline: ReplayTimeline;
  players?: Record<string, number | string | null>[];
}

const TEC_FEUDAL = 101, TEC_CASTILLOS = 102, TEC_IMPERIAL = 103;
const TC = 621;
const INVESTIGACION: Record<number, number> = {
  [TEC_FEUDAL]: 130_000, [TEC_CASTILLOS]: 160_000, [TEC_IMPERIAL]: 190_000,
};
//  Un aldeano sale cada 25 segundos de reloj de juego. Es lo que convierte
//  "173 segundos parado" en "siete aldeanos", que es lo que de verdad duele.
const SEG_POR_ALDEANO = 25;

const mmss = (ms: number) => {
  const s = Math.round(Math.abs(ms) / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
};

/**
 * El análisis de la partida, escrito como lo diría alguien que entrena.
 *
 * La versión anterior listaba diferencias -"hizo 8 acciones por minuto más"- y
 * eso no es un diagnóstico: es un dato suelto del que no se saca nada. Un
 * entrenador hace tres cosas distintas:
 *
 *   1. dice QUÉ decidió la partida y en qué fase
 *   2. dice qué COSTÓ esa decisión, en unidades que duelen (aldeanos, no
 *      segundos; minutos de ventaja perdidos, no porcentajes)
 *   3. da UNA cosa que arreglar, con su número objetivo
 *
 * Nada de esto se inventa: cada frase sale de una diferencia medida, y cuando
 * no hay diferencia que supere el ruido, no se escribe.
 */
export default function ReplayVerdict({ timeline, players = [] }: Props) {
  const { t } = useT();

  const { data: referencias } = useQuery<LevelBenchmarksResponse>({
    queryKey: ['levelBenchmarks', '6'],
    queryFn: () => getLevelBenchmarks({ match_type: '6' }),
    staleTime: 30 * 60 * 1000,
  });

  const humanos = timeline.jugadores.filter((j) => !j.es_ia);
  if (humanos.length !== 2) return null;

  const edades = new Map<number, Record<number, number>>();
  const tcs = new Map<number, number[]>();
  let rendido: number | null = null;
  for (const e of timeline.eventos) {
    if (e.tipo === 'tech' && e.id != null && INVESTIGACION[e.id]) {
      const h = edades.get(e.j) ?? {};
      if (h[e.id] == null) h[e.id] = e.t + INVESTIGACION[e.id];
      edades.set(e.j, h);
    } else if (e.tipo === 'build' && e.id === TC) {
      tcs.set(e.j, [...(tcs.get(e.j) ?? []), e.t]);
    } else if (e.tipo === 'resign') {
      rendido = e.j;
    }
  }

  const franjaDe = (r?: number) =>
    r == null ? null : r < 1000 ? '<1000' : r < 1200 ? '1000-1200'
      : r < 1400 ? '1200-1400' : r < 1600 ? '1400-1600' : '1600+';

  const datos = humanos.map((j) => {
    const p = players.find((x) => x.profile_id === j.perfil) ?? {};
    const h = edades.get(j.numero) ?? {};
    const primerTc = (tcs.get(j.numero) ?? []).sort((a, b) => a - b)[0];
    const franja = franjaDe(j.rating);
    const ref = referencias?.brackets.find((x) => x.bracket === franja);
    return {
      numero: j.numero,
      nombre: j.nombre,
      color: colorDeJugador(timeline.jugadores, j.numero),
      franja,
      ref: ref && !ref.thin ? ref : null,
      feudal: h[TEC_FEUDAL] ?? null,
      castillos: h[TEC_CASTILLOS] ?? null,
      imperial: h[TEC_IMPERIAL] ?? null,
      //  Cuánto se quedó dentro de Feudal: la ventaja de llegar pronto se
      //  pierde ahí, no en el reloj de llegada.
      enFeudal: h[TEC_FEUDAL] != null && h[TEC_CASTILLOS] != null
        ? h[TEC_CASTILLOS] - h[TEC_FEUDAL] : null,
      aldeanos: (p.villagers_15m as number) ?? null,
      parado: (p.tc_idle_ms as number) ?? null,
      conversion: h[TEC_CASTILLOS] != null && primerTc != null && primerTc > h[TEC_CASTILLOS]
        ? primerTc - h[TEC_CASTILLOS] : null,
      gano: rendido != null && j.numero !== rendido,
    };
  });

  const gana = datos.find((d) => d.gano) ?? null;
  const pierde = datos.find((d) => !d.gano && d !== gana) ?? null;
  if (!gana || !pierde) return null;

  const frases: string[] = [];

  //  1. Que decidio la partida. Se mira la fase, no una cifra suelta.
  const ventajaCastillos = gana.castillos != null && pierde.castillos != null
    ? pierde.castillos - gana.castillos : null;
  const largaParaLaVentaja = ventajaCastillos != null && ventajaCastillos > 90_000
    && timeline.duracion_ms > (gana.castillos ?? 0) * 2;

  if (ventajaCastillos != null && ventajaCastillos > 60_000) {
    frases.push(largaParaLaVentaja
      ? t('coach.ventajaSinCerrar', {
          ganador: gana.nombre, v: mmss(ventajaCastillos), dur: mmss(timeline.duracion_ms) })
      : t('coach.ventajaCerrada', { ganador: gana.nombre, v: mmss(ventajaCastillos) }));
  } else if (ventajaCastillos != null && ventajaCastillos < -60_000) {
    frases.push(t('coach.ganoPorDetras', {
      ganador: gana.nombre, perdedor: pierde.nombre, v: mmss(ventajaCastillos) }));
  }

  //  2. Que costo. En aldeanos, que es la unidad que duele.
  const difAldeanos = gana.aldeanos != null && pierde.aldeanos != null
    ? pierde.aldeanos - gana.aldeanos : null;
  if (difAldeanos != null && Math.abs(difAldeanos) >= 3) {
    frases.push(difAldeanos > 0
      ? t('coach.menosEconomia', {
          ganador: gana.nombre, n: String(difAldeanos), perdedor: pierde.nombre })
      : t('coach.masEconomia', { ganador: gana.nombre, n: String(-difAldeanos) }));
  }

  //  3. Lo que hay que arreglar, con su numero. El centro urbano parado se
  //     traduce a aldeanos perdidos, que es lo unico que mueve a nadie.
  const arreglos: { peso: number; texto: string }[] = [];
  for (const d of datos) {
    if (d.parado != null && d.parado > 60_000) {
      const perdidos = Math.round(d.parado / 1000 / SEG_POR_ALDEANO);
      if (perdidos >= 2) {
        //  La comparacion con la franja solo si la hay: "su franja tiene s de
        //  media" es peor que no decir nada.
        const conRef = d.ref?.tc_idle_s != null;
        arreglos.push({ peso: perdidos, texto: t(
          conRef ? 'coach.arregloParadoRef' : 'coach.arregloParado', {
            quien: d.nombre, s: String(Math.round(d.parado / 1000)), n: String(perdidos),
            franja: d.franja ?? '',
            ref: conRef ? String(Math.round(d.ref!.tc_idle_s!)) : '' }) });
      }
    }
    if (d.conversion != null && d.conversion > 240_000) {
      arreglos.push({ peso: Math.round(d.conversion / 60_000), texto:
        t('coach.arregloConversion', { quien: d.nombre, v: mmss(d.conversion) }) });
    }
    if (d.enFeudal != null && d.enFeudal > 11 * 60_000) {
      arreglos.push({ peso: Math.round(d.enFeudal / 60_000) - 10, texto:
        t('coach.arregloFeudalLargo', { quien: d.nombre, v: mmss(d.enFeudal) }) });
    }
  }
  arreglos.sort((a, b) => b.peso - a.peso);

  if (!frases.length && !arreglos.length) return null;

  return (
    <div className="bg-dark-800/60 border-l-2 border-gold-400/60 rounded-r-lg px-4 py-3 mb-4">
      <p className="text-[15px] leading-relaxed text-gray-200 m-0">
        <span className="font-medium" style={{ color: gana.color }}>
          {t('coach.gano', { ganador: gana.nombre })}{' '}
        </span>
        {frases.join(' ')}
      </p>

      {arreglos.length > 0 && (
        <div className="mt-3">
          <h5 className="text-[10px] uppercase tracking-wide text-gray-500 m-0 mb-1">
            {t('coach.arreglar')}
          </h5>
          <ul className="list-none p-0 m-0 flex flex-col gap-1">
            {arreglos.slice(0, 2).map((a, i) => (
              <li key={i} className="text-sm text-gray-300">· {a.texto}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-gray-600 mt-3 m-0">{t('coach.fuente')}</p>
    </div>
  );
}
