//  Los taunts, los bonus de civilización y los contrarrestos viven aquí y los
//  nombres e iconos en juego-tabla, aunque todo se siga pidiendo por este
//  fichero: lo que importa es qué JSON arrastra cada import.
//
//  Juntos pesaban 245 kB de datos en un solo trozo, y el panel en vivo -que es
//  un browser source de OBS y debería ser ligero- se los llevaba enteros para
//  usar sólo los nombres de tecnología. Separados, se lleva 93 kB.
//
//  Se reexporta todo para no tocar a quien ya importaba de aquí.
import taunts from './taunts.json';
import civsReplay from './civs-replay.json';
import civsBonus from './civs-bonus.json';
import contras from './contrarrestos.json';
export * from './juego-tabla';

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

export interface FichaUnidad { rol: string | null; fuerte: string | null; debil: string | null }

/**
 * Que es cada unidad y contra que sirve, en palabras del propio juego.
 *
 * Sale de la ficha de entrenamiento ("Anti-archer Skirmisher... Strong vs.
 * Ranged Soldiers and Spearman-line"). Importa que sea literal: aqui no se
 * opina sobre si una composicion fue buena, se enseña lo que el juego dice de
 * cada unidad y quien mira saca la cuenta.
 */
export const fichaUnidad = (id: number | null | undefined, lang: string): FichaUnidad | null => {
  if (id == null) return null;
  const f = (contras as Record<string, { en: FichaUnidad; es: FichaUnidad }>)[String(id)];
  if (!f) return null;
  return (lang === 'es' ? f.es : f.en) ?? f.en ?? null;
};
