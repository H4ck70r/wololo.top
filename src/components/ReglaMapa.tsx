/*
  El borde de un mapa de campana: una linea con las letras de la cuadricula.
  Separa las dos franjas de la portada como el marco de un mapa separa el
  territorio del margen. Va en un divisor y no encima de un titulo: las
  coordenadas no son una etiqueta de seccion, son el papel sobre el que esta
  dibujado todo.
*/
const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function ReglaMapa() {
  return (
    <div className="relative h-5" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-px bg-dark-400" />
      <div className="absolute inset-x-0 top-0 flex justify-between">
        {LETRAS.concat('').map((l, i) => (
          <span key={i} className="relative w-px">
            <span className="absolute left-0 top-0 w-px h-[7px] bg-gray-700" />
            {l && (
              <span className="absolute left-2 top-1 font-mono text-xs text-gray-700 select-none">{l}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
