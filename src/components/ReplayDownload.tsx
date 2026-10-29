import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMatchReplays } from '../lib/api';
import { useT } from '../lib/i18n';
import type { MatchReplayFile } from '../lib/types';

/**
 * Bajar la grabacion de una partida, desde donde la sirve el juego.
 *
 * Lo que se comprobo contra el endpoint oficial, porque de ello depende todo
 * lo de abajo:
 *
 *  - `https://aoe.ms/replay/?gameId=<match>&profileId=<perfil>` es real: es un
 *    301 a api.ageofempires.com y contesta `application/zip` con
 *    `Content-Disposition: attachment; filename=AgeIIDE_Replay_<match>.zip`.
 *    Dentro va un unico `AgeIIDE_Replay_<match>.aoe2record`. Permite nuestro
 *    origen por CORS, asi que un <a> normal basta y no hay que hacer de proxy.
 *  - El perfil TIENE que ser de alguien que jugo la partida Y que subio su
 *    copia. Un perfil que no jugo da 404, y tambien lo da un jugador de la
 *    partida que no la subio.
 *  - No es cuestion de fecha: hay partidas de hace meses que se bajan y
 *    partidas del dia que no. Va por pareja (partida, jugador), asi que desde
 *    el navegador NO se puede adivinar; hay que preguntar.
 *  - Recien acabada una partida tarda unos minutos en aparecer.
 *  - Pide con medida: a base de peticiones seguidas contesta 429.
 *
 * De ahi las dos reglas de este componente: no se pinta ningun enlace sin
 * haber preguntado antes a nuestra API cuales son los perfiles que SI tienen
 * fichero, y en los listados no se pregunta hasta que alguien lo pide, porque
 * seria una peticion por fila.
 */

const AOE_MS = 'https://aoe.ms/replay/';

function urlOficial(matchId: number | string, profileId: number): string {
  return `${AOE_MS}?gameId=${matchId}&profileId=${profileId}`;
}

/**
 * Cual de los ficheros se ofrece. Si el jugador cuyo perfil se esta mirando
 * subio el suyo, ese: es el que trae SU camara, y es la copia que esa persona
 * esperaria. Si no, el mas grande, que es el menos propenso a estar truncado.
 */
function elegir(replays: MatchReplayFile[], preferProfileId?: number | null): MatchReplayFile | null {
  if (replays.length === 0) return null;
  if (preferProfileId != null) {
    const mio = replays.find((r) => Number(r.profile_id) === Number(preferProfileId));
    if (mio) return mio;
  }
  return replays.reduce((a, b) => (b.size_bytes > a.size_bytes ? b : a));
}

function IconoDescarga({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

export default function ReplayDownload({
  matchId,
  preferProfileId,
  /** la ficha de la partida pregunta sola; un listado espera a que se pida */
  eager = false,
  compact = false,
  /** lo que nuestra cola ya sabe: si Relic no lo tiene, no se ofrece nada */
  knownUnavailable = false,
  className = '',
}: {
  matchId: number | string;
  preferProfileId?: number | null;
  eager?: boolean;
  compact?: boolean;
  knownUnavailable?: boolean;
  className?: string;
}) {
  const { t } = useT();
  const [pedido, setPedido] = useState(eager);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['matchReplays', String(matchId)],
    queryFn: () => getMatchReplays(matchId),
    enabled: pedido && !knownUnavailable,
    // Los URL firmados que trae la respuesta caducan en una hora y el backend
    // la cachea cinco minutos; cuatro deja margen y no repite la pregunta
    // mientras alguien pasea por la pagina.
    staleTime: 4 * 60 * 1000,
    retry: false,
  });

  // La cola ya intento bajarlo y Relic no lo tiene: no hay nada que preguntar
  // ni que ofrecer. Callar es mejor que un boton que no va a funcionar.
  if (knownUnavailable) return null;

  const elegido = data ? elegir(data.data.replays, preferProfileId) : null;
  const texto = compact ? t('replayDl.short') : t('replayDl.label');

  if (elegido && elegido.profile_id != null) {
    const kb = Math.round(elegido.size_bytes / 1024);
    return (
      <a
        href={urlOficial(matchId, elegido.profile_id)}
        // En otra pestana a proposito: lo normal es que el navegador la cierre
        // sola al ser una descarga, y si ese dia el servidor contesta un error
        // en texto plano no se lleva por delante la pagina que se estaba viendo.
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title={t('replayDl.hint')}
        className={`inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 transition-colors no-underline whitespace-nowrap ${
          compact ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } ${className}`}
      >
        <IconoDescarga className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span className="font-medium">{texto}</span>
        <span className="tabular-nums opacity-70">{t('replayDl.size', { n: kb })}</span>
      </a>
    );
  }

  if (isFetching) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap ${className}`}>
        <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
        {!compact && t('replayDl.checking')}
      </span>
    );
  }

  if (isError) {
    return (
      <span
        title={t('replayDl.failedHint')}
        className={`inline-flex items-center text-xs text-gray-600 whitespace-nowrap ${className}`}
      >
        {t('replayDl.failed')}
      </span>
    );
  }

  // Preguntamos y la respuesta fue que no hay fichero. Se dice, en gris, con
  // el motivo en el tooltip: es un dato de la partida, no un fallo nuestro.
  if (data) {
    return (
      <span
        title={t('replayDl.noneHint')}
        className={`inline-flex items-center text-xs text-gray-600 border border-dark-400 rounded px-1.5 py-0.5 whitespace-nowrap ${className}`}
      >
        {t('replayDl.none')}
      </span>
    );
  }

  // Todavia no se ha preguntado (solo en listados). El boton no promete una
  // descarga, propone comprobarla: pintar un enlace de descarga antes de
  // saberlo seria prometer un fichero que en la mitad de las partidas no esta.
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setPedido(true);
      }}
      title={t('replayDl.hint')}
      className={`inline-flex items-center gap-1 rounded border border-dark-400 text-gray-500 hover:text-gold-400 hover:border-gold-400/40 transition-colors bg-transparent cursor-pointer whitespace-nowrap ${
        compact ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${className}`}
    >
      <IconoDescarga className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span className="font-medium">{texto}</span>
    </button>
  );
}
