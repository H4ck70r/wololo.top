import { useQuery } from '@tanstack/react-query';
import { getPlayerBuildOrders } from '../lib/api';
import { useT } from '../lib/i18n';
import type { PlayerBuildOrdersResponse } from '../lib/types';

interface Props {
  profileId: number | string;
  matchType?: string;
}

const reloj = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/**
 * Lo que querías hacer contra lo que hiciste.
 *
 * Sólo se pinta la edad para la que la build da un objetivo, y cuando no lo da
 * se dice. Las builds de presión en Feudal de la guía no traen tiempo de
 * Castillos a propósito, porque ese plan se resuelve antes; rellenar ese hueco
 * con el objetivo de otra build sería compararte contra algo que no jugaste.
 */
export default function BuildOrderCompare({ profileId, matchType = '6' }: Props) {
  const { t } = useT();

  const { data, isLoading } = useQuery<PlayerBuildOrdersResponse>({
    queryKey: ['buildOrders', profileId, matchType],
    queryFn: () => getPlayerBuildOrders(profileId, { match_type: matchType }),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <p className="text-sm text-gray-500">{t('common.loading')}…</p>;
  if (!data) return null;

  const hay = data.openings.length > 0 || data.openings_without_build.length > 0;
  if (!hay) {
    return (
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-4">
        <h3 className="text-base font-semibold text-gray-200 m-0 mb-2">{t('bo.title')}</h3>
        <p className="text-sm text-gray-500 m-0">{t('bo.empty')}</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-4">
      <h3 className="text-base font-semibold text-gray-200 m-0 mb-1">{t('bo.title')}</h3>
      <p className="text-sm text-gray-400 m-0 mb-4">{t('bo.intro')}</p>

      <div className="flex flex-col gap-3">
        {data.openings.map((o) => (
          <div key={o.opening} className="bg-dark-800/50 border border-dark-500/40 rounded-lg p-3">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <span className="text-sm font-medium text-gray-200">{o.opening}</span>
              <span className="text-xs text-gray-500 tabular-nums">
                {t('bo.games', { n: String(o.games) })} · {o.wins}W
              </span>
            </div>
            <p className="text-xs text-gold-400/80 m-0 mt-0.5">{o.build_order.name}</p>

            <div className="mt-2 flex flex-col gap-1">
              {o.comparison.map((c) => {
                //  Verde si llegas antes o igual, rojo si llegas tarde. El
                //  umbral de 15 s no es cosmetico: por debajo de eso la
                //  diferencia cabe en el ruido de un clic.
                const tarde = c.delta_s > 15;
                const pronto = c.delta_s < -15;
                return (
                  <div key={c.age} className="flex items-baseline gap-2 text-sm">
                    <span className="text-gray-400 w-16">{t(`bo.${c.age}` as never)}</span>
                    <span className="text-xs text-gray-600">{t('bo.target')}</span>
                    <span className="tabular-nums text-gray-400">{reloj(c.target_s)}</span>
                    <span className="text-xs text-gray-600 ml-1">{t('bo.you')}</span>
                    <span className={`tabular-nums font-medium ${
                      tarde ? 'text-red-300' : pronto ? 'text-emerald-300' : 'text-gray-200'
                    }`}>
                      {reloj(c.you_s)}
                    </span>
                    <span className={`tabular-nums text-xs ${
                      tarde ? 'text-red-400/80' : pronto ? 'text-emerald-400/80' : 'text-gray-600'
                    }`}>
                      {c.delta_s > 0 ? '+' : ''}{c.delta_s}s
                    </span>
                    {c.target_vils != null && (
                      <span className="text-[10px] text-gray-600 ml-auto">{c.target_vils} vils</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* El hueco es de la guía, no nuestro: se dice. */}
            {o.ages_not_specified.length > 0 && (
              <p className="text-[11px] text-gray-600 m-0 mt-2">
                {t('bo.notSpecified', {
                  ages: o.ages_not_specified.map((a) => t(`bo.${a}` as never)).join(' / '),
                })}
              </p>
            )}
          </div>
        ))}
      </div>

      {data.openings_without_build.length > 0 && (
        <p className="text-[11px] text-gray-600 mt-3 m-0">
          {t('bo.noBuild', {
            list: data.openings_without_build
              .map((x) => `${x.opening} (${x.games})`)
              .join(', '),
          })}
        </p>
      )}
      <p className="text-[11px] text-gray-600 mt-1 m-0">{t('bo.mapping')}</p>
    </div>
  );
}
