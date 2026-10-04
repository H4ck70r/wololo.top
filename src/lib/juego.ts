import tabla from './nombres-juego.json';
import taunts from './taunts.json';
import civsReplay from './civs-replay.json';
import civsBonus from './civs-bonus.json';

/**
 * Nombres de edificio, unidad y tecnología, sacados de los ficheros del propio
 * juego y no deducidos.
 *
 * El replay trae ids; durante un tiempo los nombres salieron de inferirlos por
 * frecuencia y por el minuto en que aparecían, y eso sólo alcanzaba para los
 * quince o veinte más comunes. El juego los publica en
 * resources/_common/dat/CivTechTrees/*.json, un nodo por cosa con su Node ID
 * -el mismo id que usa el replay-, el id de cadena para traducirlo, la edad en
 * que se desbloquea y, en las mejoras, de qué unidad vienen.
 *
 * El extractor vive en el repo de la API (src/scripts/extraerNombresDelJuego.py)
 * y vota entre las 45 civilizaciones: varias renombran cosas -el castillo es
 * "Fort" en algunas- y quedarse con una sola daba nombres raros.
 *
 * Las inferencias anteriores quedaron todas confirmadas por esta tabla: casa,
 * centro urbano, castillo, cuartel, galería, establo, granja, aldeano,
 * arquero, explorador, caballero, lancero y Telar.
 */
export interface FichaJuego {
  en?: string;
  es?: string;
  age?: 'dark' | 'feudal' | 'castle' | 'imperial';
  /** id de la unidad de la que ésta es mejora: Ballestero -> Arquero */
  upgrade_of?: number;
  /** la tecnología que dispara la mejora */
  trigger_tech?: number;
  /** edificio donde se produce o investiga */
  building?: number;
  /** índice del icono del juego, con el que se nombran sus ficheros */
  icono?: number;
  /** unidad o tecnología exclusiva de una civilización */
  unique?: boolean;
  civ?: string;
}

type Grupo = Record<string, FichaJuego>;
const DATOS = tabla as unknown as { buildings: Grupo; units: Grupo; techs: Grupo };

const nombre = (f: FichaJuego | undefined, lang: string, id: number, tipo: string) => {
  if (!f) return lang === 'es' ? `${tipo} ${id}` : `${tipo} ${id}`;
  return (lang === 'es' ? f.es : f.en) || f.en || f.es || `${tipo} ${id}`;
};

export const edificio = (id: number): FichaJuego | undefined => DATOS.buildings[String(id)];
export const unidad = (id: number): FichaJuego | undefined => DATOS.units[String(id)];
export const tecnologia = (id: number): FichaJuego | undefined => DATOS.techs[String(id)];

export const nombreEdificio = (id: number, lang: string) =>
  nombre(edificio(id), lang, id, lang === 'es' ? 'Edificio' : 'Building');
export const nombreUnidad = (id: number, lang: string) =>
  nombre(unidad(id), lang, id, lang === 'es' ? 'Unidad' : 'Unit');
export const nombreTecnologia = (id: number, lang: string) =>
  nombre(tecnologia(id), lang, id, lang === 'es' ? 'Tecnología' : 'Tech');

/**
 * La raíz de la línea de una unidad: Arbalestero -> Ballestero -> Arquero.
 *
 * Es lo que permite juntar lo que en el campo de batalla es la misma unidad en
 * distintos momentos. Hace falta porque el replay guarda lo que se ENCOLÓ: si
 * alguien encola arqueros y luego investiga Ballestero, los que siguieran
 * vivos pasan a ser ballesteros, pero el fichero no dice cuántos sobrevivieron,
 * así que contarlos como ballesteros sería afirmar algo que no sabemos.
 */
export function raizDeLinea(id: number): number {
  const visto = new Set<number>();
  let actual = id;
  for (let i = 0; i < 8; i += 1) {
    if (visto.has(actual)) break;
    visto.add(actual);
    const padre = unidad(actual)?.upgrade_of;
    if (padre == null || padre === actual) break;
    actual = padre;
  }
  return actual;
}

/** Clase para pintar: por el edificio donde se produce. */
export function claseDeUnidad(id: number): 'eco' | 'inf' | 'tiro' | 'cab' | 'asedio' | 'otros' {
  if (id === 83) return 'eco';
  const b = unidad(raizDeLinea(id))?.building ?? unidad(id)?.building;
  if (b === 12) return 'inf';
  if (b === 87) return 'tiro';
  if (b === 101) return 'cab';
  if (b === 49) return 'asedio';
  return 'otros';
}


/**
 * La ruta del icono del juego.
 *
 * El juego numera sus iconos con el mismo Picture Index que publica el árbol
 * tecnológico, así que la pieza difícil -saber qué icono va con qué unidad- ya
 * venía resuelta con los nombres.
 *
 * El índice varía por civilización porque AoE2 tiene aspectos regionales: el
 * arquero usa el 17 en 56 civilizaciones y el 613 en las seis de antigüedad.
 * La tabla se queda con el mayoritario.
 */
const RUTA = (grupo: string, f?: FichaJuego) =>
  f?.icono == null ? null : `/iconos/${grupo}/${f.icono}.webp`;

export const iconoEdificio = (id: number) => RUTA('buildings', edificio(id));
export const iconoUnidad = (id: number) => RUTA('units', unidad(id));
export const iconoTecnologia = (id: number) => RUTA('techs', tecnologia(id));

/**
 * Lo que dice un taunt, sacado de los ficheros del juego.
 *
 * El numero que se teclea es el indice: el 11 es la risa, el 30 es "Wololo".
 * Enseñar "taunt 14" a secas no se lo lee nadie; "Comienza a jugar ya" si.
 */
export const textoTaunt = (n: number, lang: string): string | null => {
  const t = (taunts as Record<string, { en: string; es: string }>)[String(n)];
  if (!t) return null;
  return lang === 'es' ? t.es : t.en;
};

/**
 * La civilizacion que dice un REPLAY.
 *
 * Ojo: no es la numeracion del historial oficial. En una misma partida el
 * replay dice 1 y 24 donde el historial dice 5 y 34, y son los mismos dos
 * jugadores -Britons y Portuguese-. Usar la tabla equivocada pinta
 * civilizaciones que no son, asi que esta va aparte y a proposito.
 */
export const civDeReplay = (id: number | null | undefined): string | null =>
  id == null ? null : ((civsReplay as Record<string, string>)[String(id)] ?? null);

/**
 * Los bonus de una civilizacion, en las palabras del propio juego.
 *
 * Salen del mismo sitio que los nombres y van indexados por el MISMO id que
 * usa el replay: nombre en 10270+id, ficha en 120149+id. La primera linea es
 * el tipo de civilizacion ("Cavalry civilization") y el resto los bonus,
 * la unidad unica, las tecnologias unicas y el bonus de equipo.
 */
export const bonusDeCiv = (id: number | null | undefined, lang: string): string[] | null => {
  if (id == null) return null;
  const f = (civsBonus as Record<string, { en: string[]; es: string[] }>)[String(id)];
  if (!f) return null;
  return (lang === 'es' ? f.es : f.en) ?? f.en ?? null;
};
