import tabla from './nombres-juego.json';

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
