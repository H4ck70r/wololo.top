/*
  Los colores del mundo en JS, para lo que no puede leer variables CSS: los
  atributos SVG de los graficos (recharts) y los canvas. Son los mismos que
  define index.css; si cambia uno, cambia el otro.
*/
export const PALETA = {
  tinta: '#0b0a08',
  superficie: '#14120e',
  elevada: '#1a1712',
  linea: '#2e2a21',
  lineaFuerte: '#3d372b',
  hueso: '#ece4d2',
  huesoTenue: '#a39a86',
  huesoMinimo: '#8f8673',
  oro: '#e3b341',
  victoria: '#3fae6a',
  derrota: '#e0604f',
  azur: '#5b8fd6',
  bronce: '#b8814a',
} as const;

/*
  Las edades del juego como tramos de puntuacion: una sola escala de bronce a
  oro en vez del arcoiris de rangos de MOBA (cian "Diamond", morado "Legend")
  que no significa nada en Age of Empires.
*/
export type Edad = { clave: 'dark' | 'feudal' | 'castle' | 'imperial' | 'legend'; desde: number; color: string };

export const EDADES: Edad[] = [
  // Bronce oscuro a oro palido. El oro imperial de la marca (#e3b341) no esta
  // en la escala a proposito: queda reservado para la marca, el #1 y lo activo.
  { clave: 'dark', desde: 0, color: '#8f6136' },
  { clave: 'feudal', desde: 1000, color: '#a8743f' },
  { clave: 'castle', desde: 1400, color: '#bf8f55' },
  { clave: 'imperial', desde: 1800, color: '#d2ac74' },
  { clave: 'legend', desde: 2200, color: '#ecd9ac' },
];

export function edadDe(rating: number): Edad {
  let e = EDADES[0];
  for (const x of EDADES) if (rating >= x.desde) e = x;
  return e;
}
