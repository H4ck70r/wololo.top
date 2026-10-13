import { useQuery } from '@tanstack/react-query';
import { getPlayerMilestones } from '../lib/api';
import LadderBadge from './LadderBadge';
import { useT } from '../lib/i18n';
import type { MilestonesResponse, Milestone } from '../lib/types';

interface MilestonesTimelineProps {
  profileId: string;
}

//  El orden en que se enseñan y cómo se llama cada uno. Individual antes que
//  equipos dentro de cada modo, y RM primero porque es el que casi todo el
//  mundo juega.
const LADDER_ORDEN = [
  { clave: 'rm' as const,      etiqueta: '1v1 RM',   color: 'text-gold-400' },
  { clave: 'team_rm' as const, etiqueta: 'Team RM',  color: 'text-blue-400' },
  { clave: 'ew' as const,      etiqueta: '1v1 EW',   color: 'text-emerald-400' },
  { clave: 'team_ew' as const, etiqueta: 'Team EW',  color: 'text-emerald-300' },
  { clave: 'dm' as const,      etiqueta: '1v1 DM',   color: 'text-rose-400' },
  { clave: 'team_dm' as const, etiqueta: 'Team DM',  color: 'text-rose-300' },
];

function getBracket(threshold: number): { label: string; color: string; bg: string; border: string } {
  if (threshold < 1200) return { label: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-600/20', border: 'border-amber-600/40' };
  if (threshold < 1600) return { label: 'Silver', color: 'text-gray-300', bg: 'bg-gray-300/20', border: 'border-gray-300/40' };
  if (threshold < 2000) return { label: 'Gold', color: 'text-gold-400', bg: 'bg-gold-400/20', border: 'border-gold-400/40' };
  if (threshold < 2400) return { label: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-400/20', border: 'border-cyan-400/40' };
  return { label: 'Legend', color: 'text-purple-400', bg: 'bg-purple-400/20', border: 'border-purple-400/40' };
}

// The API serialises these dates as a full ISO timestamp
// ("2026-03-01T06:00:00.000Z"), so appending 'T00:00:00' produced
// "...000ZT00:00:00" and every date rendered as "Invalid Date". Take the
// YYYY-MM-DD head instead, which also accepts a plain date string, and read it
// as local midnight so the day never slides with the timezone.
function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function LadderMilestones({
  label,
  peakRating,
  peakDate,
  highestRating,
  milestones,
  accentColor,
}: {
  label?: string | null;
  peakRating: number | null;
  peakDate: string | null;
  highestRating: number | null;
  milestones: Milestone[];
  accentColor: string;
}) {
  const { t } = useT();
  const displayPeak = Math.max(peakRating || 0, highestRating || 0) || null;
  const peakIsFromLadder = highestRating && (!peakRating || highestRating > peakRating);

  if (!displayPeak && milestones.length === 0) return null;

  return (
    <div className="flex-1 min-w-0">
      {label && (
        <h4 className={`text-sm font-semibold uppercase tracking-wider ${accentColor} mb-4`}>
          {label}
        </h4>
      )}

      {/* Peak rating */}
      {displayPeak && (
        <div className="mb-5 flex items-baseline gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">{t('milestones.peak')}</span>
          <span className={`text-2xl font-bold ${accentColor}`}>{displayPeak}</span>
          {!peakIsFromLadder && formatDate(peakDate) && (
            <span className="text-xs text-gray-500">on {formatDate(peakDate)}</span>
          )}
          {peakIsFromLadder && (
            <span className="text-xs text-gray-500">{t('milestones.allTime')}</span>
          )}
        </div>
      )}

      {/* Timeline */}
      {milestones.length > 0 && (
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-1 bottom-1 w-px bg-dark-400" />

          <div className="flex flex-col gap-3">
            {milestones.map((m) => {
              const bracket = getBracket(m.threshold);
              return (
                <div key={m.threshold} className="relative flex items-center gap-3">
                  {/* Dot */}
                  <div
                    className={`absolute -left-6 w-[18px] h-[18px] rounded-full ${bracket.bg} ${bracket.border} border-2 flex items-center justify-center`}
                  >
                    <div className={`w-2 h-2 rounded-full ${bracket.bg.replace('/20', '')}`} />
                  </div>

                  {/* Content */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-bold ${bracket.color}`}>{m.threshold}</span>
                    {formatDate(m.reached_at) && (
                      <span className="text-xs text-gray-500">{formatDate(m.reached_at)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {milestones.length === 0 && displayPeak && (
        <p className="text-xs text-gray-500 italic">{t('milestones.none')}</p>
      )}
    </div>
  );
}

export default function MilestonesTimeline({ profileId }: MilestonesTimelineProps) {
  const { t } = useT();
  const { data, isLoading, error } = useQuery<MilestonesResponse>({
    queryKey: ['playerMilestones', profileId],
    queryFn: () => getPlayerMilestones(profileId),
    enabled: !!profileId,
  });

  if (isLoading) {
    return (
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  //  Todos los ladders que este jugador tenga, no solo 1v1.
  //
  //  Esto enseñaba únicamente `rm`, y tiraba `team_rm` para que un pico de
  //  equipos no se hiciera pasar por uno de individual. El riesgo era real
  //  —pasó: 1411 de Team RM leído como elo de 1v1, y lo leyó así el propio
  //  dueño del perfil, que jugó esas partidas—. Pero el arreglo no es
  //  esconder un ladder, es que cada bloque diga de cuál es. Y mientras
  //  tanto, quien juega Empire Wars o Death Match no veía sus hitos.
  const PRESENTES = LADDER_ORDEN.filter((l) => {
    const d = data.ladders[l.clave];
    return d && (d.peak_rating || d.highest_rating || d.milestones.length);
  });

  if (!PRESENTES.length) {
    return (
      <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-200 m-0 mb-5">{t('milestones.title')}</h3>
        <p className="text-gray-500 text-sm text-center py-8 m-0">{t('milestones.empty')}</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-gray-200 m-0 mb-5">{t('milestones.title')}</h3>

      <div className="flex flex-col gap-6">
        {PRESENTES.map((l) => {
          const d = data.ladders[l.clave]!;
          return (
            <div key={l.clave} className="border-t border-dark-400 first:border-0 pt-5 first:pt-0">
              {/* La etiqueta va pegada al bloque, no en la cabecera: con dos
                  o más ladders, una cabecera única no dice de cuál es cada
                  número. */}
              <div className="mb-4">
                <LadderBadge label={l.etiqueta} title={t('ladder.onlyRm')} />
              </div>
              <LadderMilestones
                peakRating={d.peak_rating}
                peakDate={d.peak_date}
                highestRating={d.highest_rating}
                milestones={d.milestones}
                accentColor={l.color}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
