import { useState } from 'react';
import { iconoTecnologia, iconoTecnologiaComoUnidad } from '../lib/juego-tabla';

/**
 * El icono de una tecnología, probando las dos carpetas.
 *
 * De las 372 tecnologías del juego, 102 no tienen fichero en iconos/techs, y
 * no son casos raros: Arbalestero, Onagro de asedio y TODAS las de élite de
 * unidad única, o sea casi todo lo que se investiga en Imperial. Son mejoras
 * de unidad y su índice apunta al atlas de unidades. El fichero existe, con
 * ese mismo número, en iconos/units.
 *
 * Cuál de las dos carpetas toca no se puede saber desde el navegador sin
 * pedirlo, así que se pide: primero la de tecnologías, y si no carga, la de
 * unidades. La alternativa era una lista de los 102 índices, que se quedaría
 * vieja en cuanto alguien añadiera ficheros y nadie se enteraría hasta ver
 * imágenes rotas otra vez.
 *
 * Si fallan las dos quedan tres letras, que siguen diciendo qué pasó y cuándo.
 */
export default function IconoTech({
  id,
  nombre,
  className = 'w-full h-full object-cover',
}: {
  id: number;
  nombre: string;
  className?: string;
}) {
  const [paso, setPaso] = useState<0 | 1 | 2>(0);
  const fuentes = [iconoTecnologia(id), iconoTecnologiaComoUnidad(id)];
  const src = paso < 2 ? fuentes[paso] : null;

  if (!src) {
    //  Las tres primeras letras de la palabra MÁS LARGA, no las del nombre.
    //  Cortando por delante, "Elite Tarkan" y "Elite Samurai" quedaban las dos
    //  en ELI, y de élite es justo la mayoría de este grupo. Por la palabra
    //  larga salen TAR y SAM, y sirve igual en castellano, donde el
    //  calificativo va detrás.
    const corto = nombre.split(/\s+/).reduce((a, b) => (b.length > a.length ? b : a), '');
    return (
      <span className="text-[9px] font-medium uppercase leading-none text-stone-400">
        {corto.slice(0, 3)}
      </span>
    );
  }

  return (
    <img
      //  La clave lleva el paso: sin ella React reaprovecha el mismo <img> al
      //  cambiar el src y, si el segundo tampoco carga, el onError ya no se
      //  vuelve a disparar en algunos navegadores.
      key={paso}
      src={src}
      alt={nombre}
      loading="lazy"
      onError={() => setPaso((p) => (p + 1) as 0 | 1 | 2)}
      className={className}
    />
  );
}
