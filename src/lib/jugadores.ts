import type { TimelinePlayer } from './types';

/**
 * El color de cada jugador, en un solo sitio.
 *
 * Estaba copiado en tres componentes y uno se quedó con la versión vieja: el
 * mapa pintaba a cada jugador con su color real y las tarjetas de unidades con
 * otro distinto, en la misma pantalla. Eso es exactamente lo que delata que una
 * cosa está hecha a trozos.
 *
 * La paleta es la de AoE2 y empieza en 0, que es como la numera el juego:
 * verificado contra una partida donde maestro_006 trae color=1 y en el chat del
 * propio juego su nombre sale en ROJO.
 */
export const COLORES_JUGADOR = [
  '#4a7fd4', // 0 azul
  '#d44a4a', // 1 rojo
  '#3fa64f', // 2 verde
  '#d9c13c', // 3 amarillo
  '#3fb8bd', // 4 cian
  '#9a56c4', // 5 morado
  '#9a9a9a', // 6 gris
  '#dd8b35', // 7 naranja
];

export function colorDeJugador(jugadores: TimelinePlayer[], numero: number): string {
  const j = jugadores.find((x) => x.numero === numero);
  //  El color del replay manda. Si falta -formatos viejos que lee mgz- se cae
  //  al número de hueco, que al menos distingue a los jugadores.
  const idx = j?.color != null ? j.color : numero - 1;
  const n = COLORES_JUGADOR.length;
  return COLORES_JUGADOR[((idx % n) + n) % n];
}

export function nombreDeJugador(jugadores: TimelinePlayer[], numero: number): string {
  return jugadores.find((x) => x.numero === numero)?.nombre ?? `#${numero}`;
}
