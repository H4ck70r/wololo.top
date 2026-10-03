import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getCivName, getCivIcon, formatDuration } from '../lib/constants';
import { outcomeOf, OUTCOME_BADGE, OUTCOME_CHIP, OUTCOME_CARD } from '../lib/matchResult';
import { useT } from '../lib/i18n';
import type { MatchRecord, MatchPlayer, SignalFlag, MatchReplayState } from '../lib/types';
import SharedCopyBadge from './SharedCopyBadge';

interface MatchRowProps {
  match: MatchRecord;
  profileId?: string | number;
  /** detecciones de copia compartida de los rivales, indexadas por profile_id */
  signalFlags?: Record<string, SignalFlag>;
}

function CivBadge({ civId, size = 'md' }: { civId: number | null | undefined; size?: 'sm' | 'md' }) {
  const icon = getCivIcon(civId ?? undefined);
  const px = size === 'sm' ? 'w-5 h-5' : 'w-7 h-7';

  if (icon) {
    return (
      <img
        src={icon}
        alt={getCivName(civId)}
        title={getCivName(civId)}
        className={`${px} rounded object-cover`}
      />
    );
  }

  return (
    <div className={`${px} rounded bg-dark-500 flex items-center justify-center text-[10px] font-bold text-gray-400`} title={getCivName(civId)}>
      {getCivName(civId).charAt(0)}
    </div>
  );
}

/**
 * Si esta partida tiene datos de replay, y si no, por que.
 *
 * Son tres cosas distintas y la diferencia importa: "analizada" se puede
 * abrir, "en cola" va a llegar, y "sin replay" NO va a llegar nunca porque
 * Relic no tiene el fichero o nadie lo subio. Pintarlas igual seria prometer
 * algo que no va a pasar.
 *
 * La cola se recorre de lo mas viejo a lo mas nuevo, porque es lo que caduca
 * antes: por eso las partidas recientes salen pendientes aunque sean tuyas.
 */
function ReplayBadge({ replay }: { replay?: MatchReplayState }) {
  const { t } = useT();
  if (!replay) return null;

  if (replay.analyzed) {
    return (
      <span
        className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/25 rounded px-1.5 py-0.5"
        title={t('replayBadge.analyzedHint')}
      >
        ▶ {replay.opening || t('replayBadge.analyzed')}
      </span>
    );
  }
  if (replay.unavailable) {
    return (
      <span
        className="text-[10px] text-gray-600 border border-dark-400 rounded px-1.5 py-0.5 whitespace-nowrap"
        title={t('replayBadge.goneHint')}
      >
        {t('replayBadge.gone')}
      </span>
    );
  }
  if (replay.queue_status === 'pending') {
    return (
      <span
        className="text-[10px] text-gray-500 border border-dark-400 rounded px-1.5 py-0.5 whitespace-nowrap"
        title={t('replayBadge.queuedHint')}
      >
        {t('replayBadge.queued')}
      </span>
    );
  }
  return null;
}

function PlayerLine({
  player,
  isCurrentPlayer,
  flag,
}: {
  player: MatchPlayer;
  isCurrentPlayer: boolean;
  flag?: SignalFlag;
}) {
  const ratingStr = player.new_rating != null ? `${player.new_rating}` : '';
  const diffStr =
    player.rating_diff != null
      ? player.rating_diff > 0
        ? `+${player.rating_diff}`
        : `${player.rating_diff}`
      : '';

  return (
    <div className={`flex items-center gap-2 py-0.5 ${isCurrentPlayer ? 'font-medium' : ''}`}>
      <CivBadge civId={player.civilization_id} size="sm" />
      <Link
        to={`/player/${player.profile_id}`}
        className={`text-xs truncate max-w-[140px] no-underline transition-colors ${
          isCurrentPlayer ? 'text-gold-400 hover:text-gold-300' : 'text-gray-300 hover:text-gray-100'
        }`}
      >
        {player.alias || `Player ${player.profile_id}`}
      </Link>
      <SharedCopyBadge flag={flag} compact />
      {ratingStr && (
        <span className="text-[11px] text-gray-500 ml-auto tabular-nums">{ratingStr}</span>
      )}
      {diffStr && (
        <span
          className={`text-[10px] tabular-nums ${
            player.rating_diff! > 0 ? 'text-win' : player.rating_diff! < 0 ? 'text-loss' : 'text-gray-500'
          }`}
        >
          {diffStr}
        </span>
      )}
    </div>
  );
}

export default function MatchRow({ match, profileId, signalFlags }: MatchRowProps) {
  const { t } = useT();
  const outcomeLabel = { win: t('match.win'), loss: t('match.loss'), pending: t('match.resultPending') } as const;
  const [expanded, setExpanded] = useState(false);
  const outcome = outcomeOf(match.result);
  const isWin = outcome === 'win';
  const ratingChange =
    match.old_rating != null && match.new_rating != null
      ? match.new_rating - match.old_rating
      : null;

  const startedAt = match.started_at ? new Date(match.started_at) : null;
  const timeAgo = startedAt ? formatTimeAgoFromDate(startedAt) : null;

  const pid = profileId ? Number(profileId) : null;
  const hasTeams = match.teams && match.teams.length > 0;
  const totalPlayers = hasTeams ? match.teams.reduce((sum, t) => sum + t.players.length, 0) : 0;
  const isTeamGame = totalPlayers > 2;

  const myTeamId = match.team_id;
  const myTeam = hasTeams ? match.teams.find((t) => t.team_id === myTeamId) : null;
  const enemyTeams = hasTeams ? match.teams.filter((t) => t.team_id !== myTeamId) : [];

  return (
    <div
      className={`rounded-lg border border-l-4 transition-colors ${OUTCOME_CARD[outcome]}`}
    >
      <div
        className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 select-none ${isTeamGame ? 'cursor-pointer' : ''}`}
        onClick={() => isTeamGame && setExpanded(!expanded)}
      >
        {/* W/L badge */}
        <div
          className={`shrink-0 w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-bold text-xs ${OUTCOME_CHIP[outcome]}`}
          title={outcomeLabel[outcome]}
        >
          {OUTCOME_BADGE[outcome]}
        </div>

        {/* Player civ */}
        <CivBadge civId={match.civilization_id} />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          {/* Sin flex-wrap: en movil partia la linea y dejaba el rival en un
              renglon propio, estirando la tarjeta al doble. Lo que cede es el
              nombre, que se recorta. */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-medium text-gold-400 text-sm truncate">
              {match.civilization || getCivName(match.civilization_id)}
            </span>

            {!isTeamGame && enemyTeams.length > 0 && enemyTeams[0].players.length > 0 ? (
              <>
                <span className="text-xs text-gray-600 shrink-0">vs</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <CivBadge civId={enemyTeams[0].players[0].civilization_id} size="sm" />
                  <Link
                    to={`/player/${enemyTeams[0].players[0].profile_id}`}
                    className="font-medium text-blue-400 text-sm hover:text-blue-300 transition-colors no-underline truncate"
                  >
                    {enemyTeams[0].players[0].alias || 'Unknown'}
                  </Link>
                  <SharedCopyBadge flag={signalFlags?.[String(enemyTeams[0].players[0].profile_id)]} />
                </div>
              </>
            ) : isTeamGame ? (
              <span className="text-xs text-gray-500 bg-dark-500 px-1.5 py-0.5 rounded">
                {match.match_type || `${Math.ceil(totalPlayers / 2)}v${Math.floor(totalPlayers / 2)}`}
              </span>
            ) : null}
          </div>

          {/* whitespace-nowrap en cada dato: sin esto "33m 05s" se parte en
              dos renglones y "4h ago" tambien. Que envuelva la fila entera,
              no las palabras. */}
          <div className="flex items-center gap-x-2.5 gap-y-0.5 mt-1 text-xs text-gray-500 flex-wrap min-w-0">
            <span className="truncate max-w-[9rem]">{match.map || match.map_name || 'Unknown'}</span>
            <ReplayBadge replay={match.replay} />
            {match.duration_seconds != null && match.duration_seconds > 0 && (
              <span className="whitespace-nowrap">{formatDuration(match.duration_seconds)}</span>
            )}
            {timeAgo && <span className="whitespace-nowrap">{timeAgo}</span>}
            <Link
              to={`/match/${match.match_id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-gray-600 hover:text-gold-400 transition-colors no-underline ml-auto"
              title={t('match.details')}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Rating + expand indicator */}
        <div className="shrink-0 text-right flex items-center gap-2">
          <div>
            {match.new_rating != null && (
              <p className="text-sm text-gray-300 font-medium m-0">{match.new_rating}</p>
            )}
            {ratingChange !== null && (
              <p
                className={`text-xs font-medium m-0 ${
                  ratingChange > 0 ? 'text-win' : ratingChange < 0 ? 'text-loss' : 'text-gray-500'
                }`}
              >
                {ratingChange > 0 ? `+${ratingChange}` : ratingChange}
              </p>
            )}
          </div>
          {isTeamGame && (
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Expanded: show all players by team */}
      {expanded && isTeamGame && hasTeams && (
        <div className="px-4 pb-3 pt-0 border-t border-dark-400/50">
          <div className={`grid gap-4 mt-3 ${enemyTeams.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* My team */}
            {myTeam && (
              <div>
                <p className={`text-[10px] uppercase tracking-wider mb-1 m-0 ${
                  outcome === 'win' ? 'text-win/70' : outcome === 'loss' ? 'text-loss/70' : 'text-pending/70'
                }`}>
                  {outcome === 'pending' ? t('match.undecidedTeam') : isWin ? t('match.winners') : t('match.losers')} &middot; Team {myTeam.team_id}
                </p>
                {myTeam.players.map((p) => (
                  <PlayerLine key={p.profile_id} player={p} isCurrentPlayer={p.profile_id === pid} />
                ))}
              </div>
            )}

            {/* Enemy teams */}
            {enemyTeams.map((team) => (
              <div key={team.team_id}>
                <p className={`text-[10px] uppercase tracking-wider mb-1 m-0 ${
                  outcome === 'pending' ? 'text-pending/70' : !isWin ? 'text-win/70' : 'text-loss/70'
                }`}>
                  {outcome === 'pending' ? t('match.undecidedTeam') : !isWin ? t('match.winners') : t('match.losers')} &middot; Team {team.team_id}
                </p>
                {team.players.map((p) => (
                  <PlayerLine
                    key={p.profile_id}
                    player={p}
                    isCurrentPlayer={false}
                    flag={signalFlags?.[String(p.profile_id)]}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgoFromDate(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(!sameYear && { year: 'numeric' }) });
}
