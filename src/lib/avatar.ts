/*
  El avatar por defecto de Steam es un "?" sobre gris, y la API lo devuelve como
  si fuera una foto real. Pintado tal cual, el #1 del mundo aparecia con un
  signo de interrogacion por cara. Se reconoce por su hash, que es el mismo
  para todas las cuentas sin avatar.
*/
const POR_DEFECTO = 'fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb';

export function avatarReal(url: string | null | undefined): string | null {
  if (!url || url.includes(POR_DEFECTO)) return null;
  return url;
}
