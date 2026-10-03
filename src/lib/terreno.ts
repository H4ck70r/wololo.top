/**
 * Cómo se pinta el terreno, sin inventarle nombre a nada.
 *
 * Los nombres de terreno no tienen fuente fiable: en las cadenas del juego los
 * ids bajos traen marcadores de desarrollo ("X", "Z", "C"), las texturas van
 * por nombre corto y no por id, y en el .dat los únicos "FOREST" que aparecen
 * son nombres de objeto -un árbol- y no del bloque de terrenos.
 *
 * También se intentó deducir la clase por lo que las partidas hacen encima
 * (edificios y órdenes por casilla, medido sobre 12 mapas) y NO sirve: las
 * granjas y las casas se plantan pegadas al bosque y el redondeo de casilla
 * las mete dentro, así que un bosque sale con densidad de edificios parecida
 * a la del suelo. Clasificó un Arabia entero como 100% suelo.
 *
 * Lo que sí funciona es la frecuencia, comprobada contra la misma partida en
 * aoe2insights: el terreno más común es el suelo (allí el 84% y se ve arena),
 * el siguiente en manchas es bosque (9,7% y se ven árboles) y los residuales
 * son agua (0,9% y se ven charcas).
 *
 * Así que se colorea por frecuencia dentro de cada mapa, que da las formas
 * correctas, y el id crudo queda a la vista. Las formas son lo que sirve para
 * orientarse; ponerles nombre sería adornar con algo que no sé.
 */
export const COLOR_SUELO = '#8a7a52';

/** Tonos para los terrenos que no son el suelo dominante, por frecuencia. */
export const TONOS_RASGO = [
  '#2f5130', // manchas grandes: casi siempre bosque
  '#3a6136',
  '#2a4a7a', // residuales: casi siempre agua
  '#6b6b45',
  '#5a4a35',
  '#7a6a4a',
];

/** Descomprime las tiras (valor, cuántos) que manda la API. */
export function expandir(tiras: [number, number][] | undefined, total: number): Uint8Array {
  const out = new Uint8Array(total);
  if (!tiras) return out;
  let i = 0;
  for (const [v, n] of tiras) {
    for (let k = 0; k < n && i < total; k += 1, i += 1) out[i] = v;
  }
  return out;
}

/**
 * Un color por terreno, decidido dentro de cada mapa: el más común es el
 * suelo y el resto recibe un tono por orden de frecuencia.
 */
export function paletaDelMapa(terreno: Uint8Array): Map<number, string> {
  const cuenta = new Map<number, number>();
  for (const v of terreno) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
  const orden = [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
  const paleta = new Map<number, string>();
  orden.forEach(([id], i) => {
    paleta.set(id, i === 0 ? COLOR_SUELO : TONOS_RASGO[(i - 1) % TONOS_RASGO.length]);
  });
  return paleta;
}

/** Qué hay en el mapa, para la leyenda: id, casillas y color. */
export function resumenTerreno(terreno: Uint8Array, paleta: Map<number, string>) {
  const cuenta = new Map<number, number>();
  for (const v of terreno) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
  return [...cuenta.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, n]) => ({ id, n, pct: (100 * n) / terreno.length, color: paleta.get(id)! }));
}
