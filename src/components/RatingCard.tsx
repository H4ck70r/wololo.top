import { useT } from '../lib/i18n';
import { edadDe } from '../lib/paleta';

interface RatingCardProps {
  label: string;
  rating: number | undefined;
  rank: number | undefined;
  topPercent?: number | null;
  ladderSize?: number | null;
  wins: number | undefined;
  losses: number | undefined;
  streak: number | undefined;
  highest: number | undefined;
  color: 'gold' | 'blue';
}

/*
  Una escalera del jugador. El color dice cual es (oro el 1v1, azur el de
  equipos) y va en la regla de arriba, no en un fondo tintado; la edad que le
  corresponde a la puntuacion va escrita al lado, que es como se habla de
  niveles en Age.
*/
export default function RatingCard({
  label,
  rating,
  rank,
  topPercent,
  ladderSize,
  wins,
  losses,
  streak,
  highest,
  color,
}: RatingCardProps) {
  const { t } = useT();
  if (!rating && !rank) return null;

  const winRate = wins && losses ? ((wins / (wins + losses)) * 100).toFixed(1) : '0.0';
  const totalGames = (wins || 0) + (losses || 0);
  const oro = color === 'gold';
  const edad = rating ? edadDe(rating) : null;

  return (
    <div className="py-5 md:px-6 md:first:pl-0">
      <div className="flex items-baseline justify-between gap-3">
        <p className="titulo text-[13px] m-0 flex items-center gap-2">
          <span className={`w-2.5 h-2.5 shrink-0 ${oro ? 'bg-gold-400' : 'bg-blue-400'}`} aria-hidden="true" />
          {label}
        </p>
        {edad && (
          <span className="font-display text-xs font-semibold tracking-[0.12em] uppercase" style={{ color: edad.color }}>
            {t(`age.${edad.clave}`)}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-3 mt-3 flex-wrap">
        <span className="cifra text-[2.6rem] text-gray-50">{rating || '—'}</span>
        {rank && <span className="cifra text-xl text-gray-300">#{rank.toLocaleString()}</span>}
        {topPercent != null && (
          <span
            className="font-mono text-xs text-gray-400 border border-dark-300 rounded-sm px-1.5 py-0.5"
            title={ladderSize ? `Rank ${rank?.toLocaleString()} / ${ladderSize.toLocaleString()}` : undefined}
          >
            {t('common.topPercent')} {topPercent}%
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-5 pt-4 border-t border-dark-400 m-0">
        <Dato etiqueta={t('common.record')}>
          <span className="text-win">{wins || 0}</span>
          <span className="text-gray-600">-</span>
          <span className="text-loss">{losses || 0}</span>
        </Dato>
        <Dato etiqueta={t('common.winRate')}>{winRate}%</Dato>
        <Dato etiqueta={t('common.games')}>{totalGames.toLocaleString()}</Dato>
        <Dato etiqueta={t('common.streak')}>
          <span className={streak && streak > 0 ? 'text-win' : streak && streak < 0 ? 'text-loss' : ''}>
            {streak && streak > 0 ? `+${streak}` : streak || '0'}
          </span>
        </Dato>
      </dl>

      {highest && (
        <p className="mt-3 mb-0 font-mono text-xs text-gray-500">
          max <span className="cifra text-base text-gray-200">{highest}</span>
        </p>
      )}
    </div>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-xs uppercase text-gray-500 truncate">{etiqueta}</dt>
      <dd className="cifra text-lg text-gray-100 m-0 mt-1">{children}</dd>
    </div>
  );
}
