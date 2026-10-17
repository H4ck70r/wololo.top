import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { getMatchDetail, getSignalFlags } from '../lib/api';
import { getCivName, getCivIcon, formatDuration } from '../lib/constants';
import { outcomeOf } from '../lib/matchResult';
import { useT } from '../lib/i18n';
import MatchReplayAnalysis from '../components/MatchReplayAnalysis';
import SharedCopyBadge from '../components/SharedCopyBadge';
import Bandera from '../components/Bandera';

export default function MatchDetailPage() {
  const { t, lang } = useT();
  const { matchId } = useParams<{ matchId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['matchDetail', matchId],
    queryFn: () => getMatchDetail(matchId!),
    enabled: !!matchId,
  });

  //  Se miran TODOS los jugadores de la partida, no solo el rival: marcar a
  //  uno y callar del otro en una pagina que los enseña a los dos ya seria
  //  tomar partido. El badge solo aparece si hay una deteccion de verdad, con
  //  confianza 80 o mas; no es un enlace de "comprueba a este tio".
  const perfiles = (data?.match?.teams ?? []).flatMap((eq) =>
    (eq.players ?? []).map((p) => p.profile_id).filter((x): x is number => x != null));
  const { data: flagsData } = useQuery({
    queryKey: ['signalFlags', perfiles],
    queryFn: () => getSignalFlags(perfiles),
    enabled: perfiles.length > 0,
    staleTime: 10 * 60 * 1000,
  });
  const flags = flagsData?.flags ?? {};

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data?.match) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h1 className="titulo text-xl mb-3">{t('match.notFound')}</h1>
        <p className="text-gray-400 mb-6 font-mono text-sm">#{matchId}</p>
        <Link to="/" className="text-gray-200 underline decoration-dark-300 hover:decoration-gold-400">{t('nav.search')} →</Link>
      </div>
    );
  }

  const match = data.match;
  const startedAt = match.started_at ? new Date(match.started_at) : null;
  const [ladoA, ladoB] = [match.teams[0], match.teams[1]];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Helmet>
        <title>{`${match.teams.map((tm) => tm.players.map((p) => p.alias).join(' + ')).join(' vs ')} · ${match.map ?? ''} - wololo.top`}</title>
        <meta name="description" content={`${match.match_type || 'Match'} on ${match.map || 'Unknown'} — ${match.player_count} players, ${formatDuration(match.duration_seconds)}.`} />
      </Helmet>

      {/*
        El marcador. Antes esto era un formulario -"Match Details", tres
        cajas con Map / Duration / Players y dos tarjetas "Team 0" y "Team 1"-
        para el momento mas de esports que tiene la web: dos jugadores, dos
        civilizaciones, un resultado. Ahora se lee como se lee una partida en
        una retransmision: quien contra quien, con que, y quien gano.
      */}
      <section className="placa overflow-hidden" aria-labelledby="marcador">
        <h1 id="marcador" className="sr-only">
          {match.teams.map((tm) => tm.players.map((p) => p.alias).join(', ')).join(' vs ')}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 sm:px-7 pt-4 pb-3 border-b border-dark-400 font-mono text-xs text-gray-400">
          <span className="text-gray-100 uppercase">{match.match_type || '—'}</span>
          <span aria-hidden="true">·</span>
          <span>
            {match.map || '—'}
            {match.map_reported && (
              <span className="text-gray-500" title={t('match.mapReported', { name: match.map_reported })}> *</span>
            )}
          </span>
          <span aria-hidden="true">·</span>
          <span>{formatDuration(match.duration_seconds)}</span>
          {startedAt && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {startedAt.toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
                {startedAt.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          )}
          <span className="ml-auto text-gray-500">#{match.match_id}</span>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch">
          {ladoA && <Bando team={ladoA} lado="izq" flags={flags} />}
          <div className="flex flex-col items-center justify-center px-1.5 sm:px-6 border-x border-dark-400 bg-dark-800/60">
            <span className="font-display text-lg sm:text-4xl font-bold text-gray-600" aria-hidden="true">VS</span>
          </div>
          {ladoB && <Bando team={ladoB} lado="der" flags={flags} />}
        </div>

        {match.teams.length > 2 && (
          <div className="border-t border-dark-400">
            {match.teams.slice(2).map((tm) => (
              <Bando key={tm.team_id} team={tm} lado="izq" flags={flags} />
            ))}
          </div>
        )}

        {match.map_reported && (
          <p className="px-5 sm:px-7 py-2.5 border-t border-dark-400 text-xs text-gray-500 m-0">
            * {t('match.mapReported', { name: match.map_reported })}
          </p>
        )}
      </section>

      {/* La tabla de cifras del replay se quito de aqui: el analisis completo
          de mas abajo la trae igual, mejor etiquetada y con la comparacion
          contra la franja. Dos tablas con los mismos numeros y etiquetas
          distintas es peor que una. */}

      {/* El mapa y el detalle completo, detras de un boton porque bajar el
          replay de Relic y parsearlo son unos segundos y una peticion a un
          servidor ajeno: no se hace solo porque alguien abra la ficha. */}
      <div className="mt-6">
        <MatchReplayAnalysis matchId={match.match_id} perfiles={perfiles} />
      </div>
    </div>
  );
}

type Equipo = NonNullable<Awaited<ReturnType<typeof getMatchDetail>>['match']>['teams'][number];

/* Un bando del marcador. En 1v1 el jugador ocupa el bando entero; en equipos,
   una fila por jugador con el mismo lenguaje a menor escala. */
function Bando({
  team,
  lado,
  flags,
}: {
  team: Equipo;
  lado: 'izq' | 'der';
  flags: Record<string, Parameters<typeof SharedCopyBadge>[0]['flag']>;
}) {
  const { t } = useT();
  const resultado = outcomeOf(team.result);
  const gana = resultado === 'win';
  const der = lado === 'der';
  const solo = team.players.length === 1;
  const color = gana ? 'text-win' : resultado === 'loss' ? 'text-loss' : 'text-pending';
  const rotulo = gana ? t('match.victory') : resultado === 'loss' ? t('match.defeat') : t('match.undecided');

  return (
    <div className={`min-w-0 px-3 sm:px-7 py-5 sm:py-7 ${der ? 'text-right' : ''} ${gana ? '' : 'opacity-[0.88]'}`}>
      <p className={`flex items-center gap-1.5 font-display text-xs sm:text-xs font-bold tracking-[0.16em] m-0 mb-4 ${color} ${der ? 'justify-end' : ''}`}>
        {gana ? <Corona /> : resultado === 'loss' ? <EscudoRoto /> : null}
        {rotulo}
      </p>
      <ul className="list-none m-0 p-0 space-y-4">
        {team.players.map((player) => {
          const icono = getCivIcon(player.civilization_id);
          const civ = player.civilization_id != null ? getCivName(player.civilization_id) : player.civilization;
          const diff = player.rating_diff;
          return (
            <li
              key={player.profile_id}
              className={`flex gap-2 sm:gap-4 ${solo ? 'flex-col sm:flex-row sm:items-center' : 'items-center'} ${
                der ? (solo ? 'items-end sm:flex-row-reverse' : 'flex-row-reverse') : 'items-start'
              }`}
            >
              {icono ? (
                <img
                  src={icono}
                  alt=""
                  className={`${solo ? 'w-14 h-14 sm:w-24 sm:h-24' : 'w-10 h-10 sm:w-12 sm:h-12'} object-contain shrink-0`}
                />
              ) : (
                <span className={`${solo ? 'w-14 h-14 sm:w-24 sm:h-24' : 'w-10 h-10'} shrink-0`} />
              )}
              <div className="min-w-0 max-w-full">
                <div className={`flex items-center gap-2 min-w-0 ${der ? 'justify-end' : ''}`}>
                  <Link
                    to={`/player/${player.profile_id}`}
                    className={`font-score font-bold text-gray-50 hover:text-gold-400 no-underline truncate leading-tight ${solo ? 'text-xl sm:text-4xl' : 'text-lg sm:text-xl'}`}
                  >
                    {player.alias || `#${player.profile_id}`}
                  </Link>
                  <SharedCopyBadge flag={flags[String(player.profile_id)]} />
                </div>
                <p className="m-0 mt-0.5 text-sm text-gray-400 truncate">
                  {player.country && <><Bandera code={player.country} className="mr-1.5" /><span className="text-gray-600">· </span></>}
                  {civ}
                </p>
                {player.new_rating != null && (
                  <p className={`m-0 mt-1.5 flex items-baseline gap-2 ${der ? 'justify-end' : ''}`}>
                    <span className={`cifra text-gray-100 ${solo ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>{player.new_rating}</span>
                    {diff != null && (
                      <span className={`cifra text-base ${diff > 0 ? 'text-win' : diff < 0 ? 'text-loss' : 'text-gray-500'}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Corona() {
  return (
    <svg viewBox="0 0 16 12" className="w-4 h-3" aria-hidden="true">
      <path d="M1 3l3.5 3L8 1l3.5 5L15 3l-1.5 8h-11z" fill="currentColor" />
    </svg>
  );
}

function EscudoRoto() {
  return (
    <svg viewBox="0 0 12 14" className="w-3 h-3.5" aria-hidden="true">
      <path d="M1 1h4.2l1.3 3.5L5 7.5l1.6 2.8L6 13 1 9.5z" fill="currentColor" />
      <path d="M7 1h4v8.5L7.6 12.4l.6-2.4L6.8 7.4 8.2 4.6z" fill="currentColor" opacity="0.55" />
    </svg>
  );
}
