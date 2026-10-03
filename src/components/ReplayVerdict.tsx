import { useT } from '../lib/i18n';
import { colorDeJugador } from '../lib/jugadores';
import type { ReplayTimeline } from '../lib/types';

interface Props {
  timeline: ReplayTimeline;
  players?: Record<string, number | string | null>[];
}

const TEC_FEUDAL = 101, TEC_CASTILLOS = 102, TEC_IMPERIAL = 103;
const TC = 621;
const INVESTIGACION: Record<number, number> = {
  [TEC_FEUDAL]: 130_000, [TEC_CASTILLOS]: 160_000, [TEC_IMPERIAL]: 190_000,
};

const mmss = (ms: number) => {
  const s = Math.round(Math.abs(ms) / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
};

/**
 * Lo que pasó en la partida, escrito.
 *
 * Una tabla no es una conclusión. Esto no inventa nada: cada frase sale de una
 * diferencia medida, y el orden en que aparecen no es estético sino el de
 * cuánto decide cada cosa, comparando ganador y perdedor DENTRO de la misma
 * partida sobre miles de pares. Ahí salió que más APM gana el 62,6%, más
 * aldeanos al minuto 15 el 61,3%, antes a Castillos el 61,2% y antes a Feudal
 * sólo el 58,9%.
 *
 * Sólo se escribe lo que supera un umbral: diferencias pequeñas caben en el
 * ruido y escribirlas sería dar peso a una casualidad.
 */
export default function ReplayVerdict({ timeline, players = [] }: Props) {
  const { t } = useT();

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

  const datos = humanos.map((j) => {
    const p = players.find((x) => x.profile_id === j.perfil) ?? {};
    const serie = timeline.ritmo?.[String(j.numero)] ?? [];
    const efectivas = serie.reduce((a, x) => a + (x[3] ?? 0), 0);
    const castillos = edades.get(j.numero)?.[TEC_CASTILLOS];
    const primerTc = (tcs.get(j.numero) ?? []).sort((a, b) => a - b)[0];
    return {
      j,
      nombre: j.nombre,
      color: colorDeJugador(timeline.jugadores, j.numero),
      apertura: (p.opening as string) ?? null,
      feudal: edades.get(j.numero)?.[TEC_FEUDAL] ?? null,
      castillos: castillos ?? null,
      imperial: edades.get(j.numero)?.[TEC_IMPERIAL] ?? null,
      aldeanos: (p.villagers_15m as number) ?? null,
      eapm: serie.length ? Math.round(efectivas / serie.length) : null,
      //  Lo que de verdad separa: cuánto tardó en convertir Castillos en un
      //  segundo centro urbano. Null si nunca puso uno.
      conversion: castillos != null && primerTc != null && primerTc > castillos
        ? primerTc - castillos : null,
    };
  });

  const [a, b] = datos;
  const ganador = rendido != null ? datos.find((d) => d.j.numero !== rendido) : null;

  type Hallazgo = { peso: number; texto: string; mejor: string };
  const hallazgos: Hallazgo[] = [];
  const mejorEn = (va: number | null, vb: number | null, menor: boolean) => {
    if (va == null || vb == null) return null;
    const gana = menor ? va < vb : va > vb;
    return { quien: gana ? a : b, otro: gana ? b : a, dif: Math.abs(va - vb) };
  };

  //  El orden es el de cuanto decide cada cosa, medido, no opinado.
  const r1 = mejorEn(a.eapm, b.eapm, false);
  if (r1 && r1.dif >= 5) hallazgos.push({ peso: 62.6, mejor: r1.quien.nombre,
    texto: t('verd.apm', { ganador: r1.quien.nombre, n: String(r1.dif), perdedor: r1.otro.nombre }) });

  const r2 = mejorEn(a.aldeanos, b.aldeanos, false);
  if (r2 && r2.dif >= 2) hallazgos.push({ peso: 61.3, mejor: r2.quien.nombre,
    texto: t('verd.vils', { ganador: r2.quien.nombre, n: String(Math.round(r2.dif)) }) });

  const r3 = mejorEn(a.castillos, b.castillos, true);
  if (r3 && r3.dif >= 20000) hallazgos.push({ peso: 61.2, mejor: r3.quien.nombre,
    texto: t('verd.castle', { ganador: r3.quien.nombre, n: mmss(r3.dif) }) });

  const r4 = mejorEn(a.conversion, b.conversion, true);
  if (r4 && r4.dif >= 60000) hallazgos.push({ peso: 61.0, mejor: r4.quien.nombre,
    texto: t('verd.convert', { ganador: r4.quien.nombre, a: mmss(r4.quien.conversion!),
                              perdedor: r4.otro.nombre, b: mmss(r4.otro.conversion!) }) });

  const r5 = mejorEn(a.feudal, b.feudal, true);
  if (r5 && r5.dif >= 20000) hallazgos.push({ peso: 58.9, mejor: r5.quien.nombre,
    texto: t('verd.feudal', { ganador: r5.quien.nombre, n: mmss(r5.dif) }) });

  hallazgos.sort((x, y) => y.peso - x.peso);
  if (!hallazgos.length) return null;

  //  La frase de arriba: lo que mas decide, y si lo tuvo quien gano.
  const principal = hallazgos[0];
  const coincide = ganador ? principal.mejor === ganador.nombre : null;

  return (
    <div className="bg-dark-800/60 border-l-2 border-gold-400/60 rounded-r-lg px-4 py-3 mb-4">
      <p className="text-[15px] leading-relaxed text-gray-200 m-0">
        {ganador && (
          <span className="font-medium" style={{ color: ganador.color }}>
            {t('verd.won', { ganador: ganador.nombre })}{' '}
          </span>
        )}
        {principal.texto}
      </p>

      {hallazgos.length > 1 && (
        <ul className="list-none p-0 mt-2 m-0 flex flex-col gap-1">
          {hallazgos.slice(1).map((h, i) => (
            <li key={i} className="text-sm text-gray-400">· {h.texto}</li>
          ))}
        </ul>
      )}

      {/* Cuando lo que mas decide NO lo tuvo quien gano, decirlo: es la
          partida interesante, no la excepcion que se esconde. */}
      {coincide === false && (
        <p className="text-xs text-gray-500 mt-2 m-0">
          {t('verd.contra', { ganador: ganador!.nombre, otro: principal.mejor })}
        </p>
      )}

      <p className="text-[11px] text-gray-600 mt-2 m-0">{t('verd.fuente')}</p>
    </div>
  );
}
