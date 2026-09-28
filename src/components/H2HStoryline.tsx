import { useT } from '../lib/i18n';
import { formatDuration } from '../lib/constants';
import type { H2HSummary, H2HMatchTypeRow } from '../lib/types';

interface Props {
  summary: H2HSummary;
  byMatchType: H2HMatchTypeRow[];
  unresolved: number;
}

/**
 * What the scoreline leaves out. A rivalry is a streak, a rating balance, a
 * length and an expectation that keeps being missed; "0-6" carries none of it.
 */
export default function H2HStoryline({ summary, byMatchType, unresolved }: Props) {
  const { t, lang } = useT();
  const { streaks, elo, duration, elo_expectation: exp } = summary;

  const date = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    }) : null;

  const tiles: { label: string; value: string; note?: string; tone?: 'good' | 'bad' }[] = [];

  if (streaks.current) {
    const losing = streaks.current.type === 'loss';
    tiles.push({
      label: t('h2h.currentStreak'),
      value: t(losing ? 'h2h.streakLoss' : 'h2h.streakWin', { n: streaks.current.count }),
      note: t('h2h.longestRuns', { w: streaks.longest_win, l: streaks.longest_loss }),
      tone: losing ? 'bad' : 'good',
    });
  }

  if (elo.net != null && elo.rated_games > 0) {
    tiles.push({
      label: t('h2h.eloNet'),
      value: `${elo.net > 0 ? '+' : ''}${elo.net}`,
      // Older matches carry no rating, so the total says what it rests on
      // instead of pretending to cover every meeting.
      note: t('h2h.eloRatedGames', { n: elo.rated_games }),
      tone: elo.net >= 0 ? 'good' : 'bad',
    });
  }

  if (duration.h2h_seconds) {
    const delta = duration.delta_seconds;
    tiles.push({
      label: t('h2h.durationTitle'),
      value: formatDuration(duration.h2h_seconds),
      note: delta
        ? t(delta > 0 ? 'h2h.durationLonger' : 'h2h.durationShorter', {
            delta: formatDuration(Math.abs(delta)),
          })
        : undefined,
    });
  }

  if (exp) {
    // Landing under what Elo predicted is the difference between "he is
    // better" and "this one has my number".
    const under = exp.actual_wins < exp.expected_wins;
    tiles.push({
      label: t('h2h.expectedTitle'),
      value: t('h2h.expectedWins', { expected: exp.expected_wins, actual: exp.actual_wins }),
      note: `${t('h2h.asUnderdog', { w: exp.as_underdog.wins, g: exp.as_underdog.games })} · ${t(
        'h2h.asFavourite',
        { w: exp.as_favourite.wins, g: exp.as_favourite.games }
      )}`,
      tone: under ? 'bad' : 'good',
    });
  }

  if (!tiles.length) return null;

  const toneClass = (tone?: 'good' | 'bad') =>
    tone === 'bad' ? 'text-red-400' : tone === 'good' ? 'text-green-400' : 'text-gray-200';

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5 mb-6">
      <div className="flex items-baseline gap-2 flex-wrap mb-3">
        <h2 className="text-lg font-semibold text-gray-200 m-0">{t('h2h.storyline')}</h2>
        {summary.first_meeting && (
          <span className="text-xs text-gray-500">
            {t('h2h.firstMet', { date: date(summary.first_meeting) ?? '' })}
            {summary.last_meeting && ` · ${t('h2h.lastMet', { date: date(summary.last_meeting) ?? '' })}`}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="bg-dark-600/60 border border-dark-500/60 rounded-lg px-3 py-2.5">
            <div className="text-[10px] uppercase tracking-wide text-gray-600">{tile.label}</div>
            <div className={`text-base font-semibold ${toneClass(tile.tone)}`}>{tile.value}</div>
            {tile.note && <div className="text-[11px] text-gray-500 mt-0.5">{tile.note}</div>}
          </div>
        ))}
      </div>

      {byMatchType.length > 1 && (
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {byMatchType.map((row) => (
            <span
              key={row.match_type_id}
              className="px-2 py-1 rounded text-xs text-gray-400 bg-dark-600/60 border border-dark-500/60"
            >
              {row.match_type}: {row.wins}-{row.losses}
            </span>
          ))}
        </div>
      )}

      {(unresolved > 0 || summary.truncated) && (
        <p className="text-[11px] text-gray-600 mt-3 m-0">
          {unresolved > 0 && t('h2h.unresolved', { n: unresolved })}
          {unresolved > 0 && summary.truncated && ' '}
          {summary.truncated && t('h2h.truncated')}
        </p>
      )}
    </div>
  );
}
