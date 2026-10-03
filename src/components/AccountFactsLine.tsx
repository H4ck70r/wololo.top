import { useT } from '../lib/i18n';
import type { AccountFacts } from '../lib/types';

/**
 * Datos neutros de la cuenta: antiguedad en Steam, cuantos nicks ha usado y si
 * esta jugando ahora. Van sueltos en la cabecera y NO dentro de la tarjeta de
 * deteccion: una cuenta vieja o con muchos nicks no acusa a nadie de nada, y
 * juntarlo bajo un titulo de "smurf" lo convertiria en una insinuacion.
 */
export default function AccountFactsLine({
  account,
  nickCount,
  renameCount,
}: {
  account: AccountFacts | null | undefined;
  nickCount: number;
  renameCount: number;
}) {
  const { t, lang } = useT();

  const bits: string[] = [];

  if (account?.created_at) {
    const d = new Date(account.created_at);
    if (!Number.isNaN(d.getTime())) {
      bits.push(
        t('signals.account.created', {
          date: d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
            month: 'short',
            year: 'numeric',
          }),
        })
      );
    }
  }

  if (nickCount > 1) bits.push(t('signals.account.nicks', { n: nickCount }));
  if (renameCount === 1) bits.push(t('signals.account.renameOne'));
  else if (renameCount > 1) bits.push(t('signals.account.renames', { n: renameCount }));
  if (account?.playing_now) bits.push(t('signals.account.playingNow', { game: account.playing_now }));

  if (bits.length === 0) return null;

  return (
    <p className="text-xs text-gray-600 mt-1 m-0">
      {bits.join(' · ')}
    </p>
  );
}
