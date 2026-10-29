import type { SignalFlag } from './types';

type FlagConPrestamista = Pick<SignalFlag, 'lender_profile_id'>;

/**
 * De un lote de detecciones, que profile_ids figuran como cuenta principal.
 *
 * Es lo unico que se puede saber desde la web, y conviene decirlo claro: el
 * lote llega indexado por la cuenta SECUNDARIA, y de la principal trae su
 * profile_id. Asi que la marca de principal solo sale cuando las dos cuentas
 * del vinculo aparecen en la MISMA vista (la partida, el cara a cara).
 *
 * No hay forma de preguntar "¿es este jugador la cuenta principal de
 * alguien?": el backend no publica el lado prestamista por jugador, y lo hace
 * a proposito, para que prestar tu biblioteca de Steam no te convierta en
 * sospechoso. Mientras siga asi, esta marca es un extra cuando se puede, no
 * una garantia de que toda cuenta principal salga marcada.
 */
export function mainAccountIds(
  flags: Record<string, FlagConPrestamista> | undefined | null
): Set<number> {
  const ids = new Set<number>();
  if (!flags) return ids;
  for (const flag of Object.values(flags)) {
    if (flag?.lender_profile_id != null) ids.add(Number(flag.lender_profile_id));
  }
  return ids;
}
