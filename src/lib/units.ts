/**
 * Nombres de unidad por id, para leer lo que un jugador encargó.
 *
 * Verificados contra replays reales por frecuencia Y por el minuto en que
 * aparecen por primera vez, no de memoria: el aldeano arranca en el 0,0; el
 * guerrillero, el scout, el arquero y el lancero salen entre el 8,4 y el 9,7
 * -o sea en Feudal-; el caballero y el arquero a caballo no antes del 19,2,
 * que es Castillos; el monje sale en las ocho partidas medidas desde el 14,7.
 *
 * Lo que NO está aquí se enseña como "otra": en la muestra, los ids altos que
 * aparecen en una sola partida son unidades únicas de civilización, y
 * ponerles nombre a ojo sería inventar.
 */
export interface Unidad {
  es: string;
  en: string;
  /** para agrupar la gráfica: eco, infantería, tiro, caballería, asedio, otros */
  clase: 'eco' | 'inf' | 'tiro' | 'cab' | 'asedio' | 'otros';
}

export const UNIDADES: Record<number, Unidad> = {
  83:  { es: 'Aldeano', en: 'Villager', clase: 'eco' },
  74:  { es: 'Milicia', en: 'Militia', clase: 'inf' },
  75:  { es: 'Hombre de armas', en: 'Man-at-arms', clase: 'inf' },
  93:  { es: 'Lancero', en: 'Spearman', clase: 'inf' },
  358: { es: 'Piquero', en: 'Pikeman', clase: 'inf' },
  4:   { es: 'Arquero', en: 'Archer', clase: 'tiro' },
  7:   { es: 'Guerrillero', en: 'Skirmisher', clase: 'tiro' },
  5:   { es: 'Arcabucero', en: 'Hand cannoneer', clase: 'tiro' },
  24:  { es: 'Ballestero', en: 'Crossbowman', clase: 'tiro' },
  448: { es: 'Explorador', en: 'Scout cavalry', clase: 'cab' },
  38:  { es: 'Caballero', en: 'Knight', clase: 'cab' },
  39:  { es: 'Arquero a caballo', en: 'Cavalry archer', clase: 'cab' },
  546: { es: 'Caballería ligera', en: 'Light cavalry', clase: 'cab' },
  280: { es: 'Manganel', en: 'Mangonel', clase: 'asedio' },
  279: { es: 'Escorpión', en: 'Scorpion', clase: 'asedio' },
  36:  { es: 'Bombarda', en: 'Bombard cannon', clase: 'asedio' },
  331: { es: 'Trabuquete', en: 'Trebuchet', clase: 'asedio' },
  125: { es: 'Monje', en: 'Monk', clase: 'otros' },
};

/**
 * Un color por clase, elegidos para que no se confundan entre ellos.
 *
 * Infantería y asedio estaban en dos naranjas casi iguales (#d9843c y
 * #b4603c) y en barras pequeñas no había forma de distinguirlos. El asedio
 * pasa a gris acero -son máquinas- que no se parece a ninguno de los otros
 * cuatro. El gris no choca con el de economía porque los aldeanos no entran
 * en este gráfico.
 */
export const CLASE_COLOR: Record<Unidad['clase'], string> = {
  eco: '#7f8794',
  inf: '#e08a3c',
  tiro: '#5fb36a',
  cab: '#5b8dd6',
  asedio: '#aeb4bd',
  otros: '#9a6fc4',
};

export function nombreUnidad(id: number, lang: string): string {
  const u = UNIDADES[id];
  if (u) return lang === 'es' ? u.es : u.en;
  //  Mejor decir que no lo conocemos que ponerle el nombre de otra cosa.
  return lang === 'es' ? `Unidad única (${id})` : `Unique unit (${id})`;
}

export const claseDe = (id: number): Unidad['clase'] => UNIDADES[id]?.clase ?? 'otros';
