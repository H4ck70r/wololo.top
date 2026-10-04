import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const ANCHO = 320;
const MARGEN = 10;

/**
 * La explicación de una cifra, detrás de un icono.
 *
 * Las notas estaban escritas al pie de cada título y entre todas convertían el
 * panel en un muro: tres líneas de texto antes de llegar al número que se
 * venía a ver. Siguen estando -sin ellas nadie sabe qué mide cada cosa y por
 * qué se puede fiar- pero a un toque de distancia.
 *
 * Va en posición fija y con la coordenada calculada, no pegada al icono, por
 * dos motivos: anclada al icono se salía de la pantalla en un móvil -el icono
 * va detrás del título, o sea a media anchura, y la caja mide 320px-, y el
 * panel de pestañas tiene scroll propio, que le habría cortado la parte de
 * abajo. Al desplazar se cierra, que es lo que uno espera de algo flotante.
 */
export default function Nota({ children }: Props) {
  const [sitio, setSitio] = useState<{ x: number; y: number } | null>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const id = useId();

  const abrir = useCallback(() => {
    const b = boton.current?.getBoundingClientRect();
    if (!b) return;
    //  Centrada sobre el icono, pero sin salirse por ningún lado.
    const x = Math.min(
      Math.max(b.left + b.width / 2 - ANCHO / 2, MARGEN),
      window.innerWidth - ANCHO - MARGEN
    );
    setSitio({ x: Math.max(MARGEN, x), y: b.bottom + 6 });
  }, []);

  useEffect(() => {
    if (!sitio) return;
    const cerrar = () => setSitio(null);
    const fuera = (e: MouseEvent | TouchEvent) => {
      if (!boton.current?.contains(e.target as Node)) cerrar();
    };
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') cerrar(); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('touchstart', fuera);
    document.addEventListener('keydown', tecla);
    window.addEventListener('scroll', cerrar, true);
    window.addEventListener('resize', cerrar);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('touchstart', fuera);
      document.removeEventListener('keydown', tecla);
      window.removeEventListener('scroll', cerrar, true);
      window.removeEventListener('resize', cerrar);
    };
  }, [sitio]);

  return (
    <>
      <button
        ref={boton}
        type="button"
        onClick={() => (sitio ? setSitio(null) : abrir())}
        onMouseEnter={abrir}
        onMouseLeave={() => setSitio(null)}
        aria-expanded={!!sitio}
        aria-describedby={sitio ? id : undefined}
        className={`w-4 h-4 shrink-0 inline-flex items-center justify-center rounded-full border text-[10px] leading-none cursor-pointer transition-colors bg-transparent ${
          sitio
            ? 'border-gold-500/60 text-gold-400'
            : 'border-dark-400 text-gray-600 hover:text-gray-300 hover:border-gray-500'
        }`}
      >
        i
      </button>
      {sitio && (
        <span
          id={id}
          role="tooltip"
          style={{ left: sitio.x, top: sitio.y, width: Math.min(ANCHO, window.innerWidth - MARGEN * 2) }}
          className="fixed z-50 p-3 rounded-lg bg-dark-800 border border-dark-400 shadow-xl text-xs text-gray-400 font-normal normal-case tracking-normal leading-relaxed text-left block"
        >
          {children}
        </span>
      )}
    </>
  );
}
