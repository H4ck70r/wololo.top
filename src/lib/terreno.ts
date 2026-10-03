/**
 * De qué es cada terreno, medido y no adivinado.
 *
 * Los nombres de terreno no tienen fuente fiable: en el fichero de cadenas del
 * juego los ids bajos traen marcadores de desarrollo ("X", "Z", "C") y las
 * texturas van por nombre corto, no por id. Así que en vez de inventarles
 * nombre se clasifican por lo que las partidas hacen encima, medido sobre 12
 * mapas: edificios y órdenes de movimiento por cada mil casillas.
 *
 * Un terreno donde NADIE construye en doce mapas no es suelo. Y de ésos, el
 * que además casi no recibe órdenes de movimiento es agua: a un bosque se
 * mandan aldeanos a talar constantemente, al agua no.
 *
 * Lo que no esté en la tabla se pinta como suelo, que es lo más común, y el
 * mapa enseña el id crudo al pasar el ratón para que nada quede inventado.
 */
export type ClaseTerreno = 'suelo' | 'bosque' | 'agua';

export const CLASE_TERRENO: Record<number, ClaseTerreno> = {
  0: 'suelo', 5: 'suelo', 6: 'suelo', 7: 'suelo', 9: 'suelo', 10: 'suelo',
  12: 'suelo', 13: 'suelo', 14: 'suelo', 17: 'suelo', 18: 'suelo', 19: 'suelo',
  48: 'suelo', 56: 'suelo', 60: 'suelo', 71: 'suelo', 88: 'suelo', 89: 'suelo',
  100: 'suelo', 104: 'suelo', 110: 'suelo', 128: 'suelo',
  2: 'bosque', 27: 'bosque', 113: 'bosque',
  1: 'agua',
};

export const COLOR_TERRENO: Record<ClaseTerreno, string> = {
  suelo: '#8a7a52',
  bosque: '#2f5130',
  agua: '#2a4a7a',
};

export const claseTerreno = (id: number): ClaseTerreno => CLASE_TERRENO[id] ?? 'suelo';

/** Descomprime las tiras (valor, cuantos) que manda la API. */
export function expandir(tiras: [number, number][] | undefined, total: number): Uint8Array {
  const out = new Uint8Array(total);
  if (!tiras) return out;
  let i = 0;
  for (const [v, n] of tiras) {
    for (let k = 0; k < n && i < total; k += 1, i += 1) out[i] = v;
  }
  return out;
}
