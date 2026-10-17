import { useT } from '../lib/i18n';
import { EDADES, edadDe } from '../lib/paleta';

/*
  La edad de una puntuacion: un rombo del color del tramo, la misma pieza que
  marca los hitos del perfil. Una barra de 3px se leia como una "I" o un "|"
  pegado al numero; el rombo es una ficha, y la leyenda (LeyendaEdades) dice
  que significa cada color sin tener que pasar el raton por encima.
*/
export default function MarcaEdad({ rating, className = '' }: { rating: number; className?: string }) {
  const { t } = useT();
  const edad = edadDe(rating);
  return (
    <span
      className={`inline-block w-2 h-2 rotate-45 shrink-0 ${className}`}
      style={{ backgroundColor: edad.color }}
      title={t(`age.${edad.clave}`)}
      aria-label={t(`age.${edad.clave}`)}
      role="img"
    />
  );
}

export function LeyendaEdades({ className = '' }: { className?: string }) {
  const { t } = useT();
  return (
    <p className={`flex flex-wrap items-center gap-x-4 gap-y-1 m-0 text-xs text-gray-400 ${className}`}>
      {EDADES.map((e) => (
        <span key={e.clave} className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rotate-45" style={{ backgroundColor: e.color }} aria-hidden="true" />
          {t(`age.${e.clave}`)}
          <span className="font-mono text-gray-500">{e.desde > 0 ? `${e.desde}+` : `<${EDADES[1].desde}`}</span>
        </span>
      ))}
    </p>
  );
}
