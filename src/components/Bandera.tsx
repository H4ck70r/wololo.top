import { countryName } from '../lib/constants';
import { useT } from '../lib/i18n';

/*
  La bandera del pais como imagen SVG servida desde el propio dominio
  (public/banderas, del paquete flag-icons, MIT).

  No es el emoji: las banderas emoji no se dibujan en Windows -salen dos
  letras sueltas- y cambian de aspecto en cada sistema. Durante un tiempo se
  pinto solo el codigo (MX, ES) por eso, pero la bandera se reconoce de un
  vistazo y el codigo hay que leerlo: en una lista de jugadores, la bandera
  es la informacion.
*/
export default function Bandera({ code, className = '' }: { code: string | null | undefined; className?: string }) {
  const { lang } = useT();
  if (!code || code.length !== 2) return null;
  const c = code.toLowerCase();
  const nombre = countryName(c, lang) || c.toUpperCase();
  return (
    <img
      src={`/banderas/${c}.svg`}
      alt={nombre}
      title={nombre}
      width={20}
      height={15}
      loading="lazy"
      decoding="async"
      className={`inline-block w-5 h-[15px] shrink-0 rounded-[1px] object-cover ring-1 ring-black/40 align-[-2px] ${className}`}
      onError={(e) => {
        //  Un codigo que flag-icons no trae (o que la API manda raro): mejor
        //  nada que un icono roto.
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
