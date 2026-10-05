import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMatchTimeline } from '../lib/api';
import { useT } from '../lib/i18n';
import { useSession } from '../lib/session';
import ReplayAnalysis from './ReplayAnalysis';
import type { MatchTimelineResponse } from '../lib/types';

interface Props {
  matchId: number | string;
  /** los perfiles que jugaron, para saber si quien mira es uno de ellos */
  perfiles?: number[];
}

/**
 * El mapa y el detalle de una partida del ladder.
 *
 * Va detrás de un botón a propósito: la cronología no está guardada, se baja
 * el replay de Relic y se parsea al vuelo, que son unos segundos y una petición
 * a un servidor ajeno. Cargarlo solo porque alguien abrió la ficha sería pedirle
 * a Relic un replay por cada visita.
 *
 * Y cuando Relic ya no lo tiene -los borra al año- se dice con todas las
 * letras, en vez de dejar un bloque cargando para siempre.
 */
export default function MatchReplayAnalysis({ matchId, perfiles = [] }: Props) {
  const { t } = useT();
  const { user } = useSession();
  const [pedido, setPedido] = useState(false);

  //  Si quien mira jugó esta partida, se pide SU fichero: es el único que trae
  //  su cámara, y sin esto la sección de atención acaba contando dónde miraba
  //  el rival. Si no jugó, se deja elegir al servidor como siempre.
  const mio = user?.profile_id != null && perfiles.includes(Number(user.profile_id))
    ? Number(user.profile_id)
    : null;

  const { data, isLoading, error } = useQuery<MatchTimelineResponse>({
    queryKey: ['matchTimeline', matchId, mio],
    queryFn: () => getMatchTimeline(matchId, mio),
    enabled: pedido,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  if (!pedido) {
    return (
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-4">
        <h3 className="text-base font-semibold text-gray-200 m-0 mb-1">{t('matchMap.title')}</h3>
        <p className="text-sm text-gray-400 m-0 mb-3">{t('matchMap.intro')}</p>
        <button
          onClick={() => setPedido(true)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gold-500/20 text-gold-300 border border-gold-500/30 hover:bg-gold-500/30"
        >
          {t('matchMap.load')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-4">
      <h3 className="text-base font-semibold text-gray-200 m-0 mb-3">{t('matchMap.title')}</h3>
      {isLoading && <p className="text-sm text-gray-500 m-0">{t('matchMap.loading')}</p>}
      {error && <p className="text-sm text-gray-500 m-0">{t('matchMap.gone')}</p>}
      {data?.timeline && (
        <ReplayAnalysis
          timeline={data.timeline}
          players={data.players as Record<string, number | string | null>[]}
          info={data.info}
        />
      )}
      {data && !data.timeline && (
        <p className="text-sm text-gray-500 m-0">{data.timeline_error || t('matchMap.gone')}</p>
      )}
    </div>
  );
}
