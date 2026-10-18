import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPlayerMilestones } from '../lib/api';
import LadderBadge from './LadderBadge';
import { useT } from '../lib/i18n';
import type { MilestonesResponse, Milestone, LadderKey } from '../lib/types';

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


// The API serialises these dates as a full ISO timestamp
// ("2026-03-01T06:00:00.000Z"), so appending 'T00:00:00' produced
// "...000ZT00:00:00" and every date rendered as "Invalid Date". Take the
// YYYY-MM-DD head instead, which also accepts a plain date string, and read it
// as local midnight so the day never slides with the timezone.
function formatDate(dateStr: string | null | undefined, lang: string): string | null {
  if (!dateStr) return null;
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  //  Con el idioma de la página, no con 'en-US' fijo: en la versión española
  //  salían fechas como "May 9, 2024" al lado de texto en castellano.
  return d.toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' });
}

/*
  El top% de un hito, rotulado. "Ese dia" sale de la foto diaria del ladder,
  que existe desde marzo de 2026; para lo anterior se dice lo que vale ese
  rating hoy entre los activos, en tono mas tenue y con la palabra "hoy",
  para que nadie lea un 2021 como si fuera un dato de 2021.
*/
function TopDelHito({ then, now }: { then?: number | null; now?: number | null }) {
  const { t } = useT();
  if (then != null) {
    return (
      <span className="inline-flex items-baseline gap-1.5">
        <span className="cifra text-base text-gray-100">{t('common.topPercent')} {then}%</span>
        <span className="font-mono text-xs text-gray-500">{t('milestones.then')}</span>
      </span>
    );
  }
  if (now != null) {
    return <span className="font-mono text-xs text-gray-500">{t('milestones.nowTop', { p: now })}</span>;
  }
  return null;
}

function LadderMilestones({
  label,
  peakRating,
  peakDate,
  peakThen,
  peakNow,
  highestRating,
  milestones,
  accentColor,
}: {
  label?: string | null;
  peakRating: number | null;
  peakDate: string | null;
  peakThen?: number | null;
  peakNow?: number | null;
  highestRating: number | null;
  milestones: Milestone[];
  accentColor: string;
}) {
  const { t, lang } = useT();
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
          {!peakIsFromLadder && formatDate(peakDate, lang) && (
            <span className="text-xs text-gray-500">
              {t('milestones.on', { date: formatDate(peakDate, lang)! })}
            </span>
          )}
          {peakIsFromLadder && (
            <span className="text-xs text-gray-500">{t('milestones.allTime')}</span>
          )}
          {!peakIsFromLadder && <TopDelHito then={peakThen} now={peakNow} />}
        </div>
      )}

      {/* Timeline */}
      {milestones.length > 0 && (
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-1 bottom-1 w-px bg-dark-400" />

          <div className="flex flex-col gap-3">
            {milestones.map((m, i) => {
              //  Solo el numero, la fecha y el sitio que daba. Las edades del
              //  juego como tramos se quitaron: no aportaban y confundian.
              const ultimo = i === milestones.length - 1;
              return (
                <div key={m.threshold} className="relative flex items-center gap-3">
                  <div
                    className={`absolute -left-6 w-[18px] h-[18px] rotate-45 border-2 bg-dark-700 flex items-center justify-center ${ultimo ? 'border-gold-400' : 'border-dark-300'}`}
                    aria-hidden="true"
                  >
                    <div className={`w-1.5 h-1.5 ${ultimo ? 'bg-gold-400' : 'bg-gray-600'}`} />
                  </div>

                  <div className="flex items-baseline gap-x-3 gap-y-0.5 flex-wrap">
                    <span className="cifra text-lg text-gray-50 w-12">{m.threshold}</span>
                    {formatDate(m.reached_at, lang) && (
                      <span className="font-mono text-xs text-gray-500">{formatDate(m.reached_at, lang)}</span>
                    )}
                    <TopDelHito then={m.top_percent_then} now={m.top_percent_now} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {milestones.some((m) => m.top_percent_then == null && m.top_percent_now != null) && (
        <p className="text-xs text-gray-500 mt-4 mb-0 max-w-prose">{t('milestones.note')}</p>
      )}

      {milestones.length === 0 && displayPeak && (
        <p className="text-xs text-gray-500 italic">{t('milestones.none')}</p>
      )}
    </div>
  );
}

export default function MilestonesTimeline({ profileId }: MilestonesTimelineProps) {
  const { t } = useT();
  const [abierta, setAbierta] = useState<LadderKey | null>(null);
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
        <h3 className="titulo text-[15px] m-0 mb-5">{t('milestones.title')}</h3>
        <p className="text-gray-500 text-sm text-center py-8 m-0">{t('milestones.empty')}</p>
      </div>
    );
  }

  //  Con un solo ladder no hay nada que elegir: pestanas para una cosa son
  //  ruido. Con dos o mas si, y sobre todo con seis -Hera los tiene- donde
  //  apilados salen seis bloques de hasta once hitos cada uno.
  //
  //  Ademas la grafica de rating, justo encima, ya selecciona ladder con
  //  botones. Dos componentes seguidos eligiendo lo mismo de dos formas
  //  distintas es peor que cualquiera de las dos.
  const unico = PRESENTES.length === 1;
  const activa = PRESENTES.find((l) => l.clave === abierta) ?? PRESENTES[0];
  const datos = data.ladders[activa.clave]!;

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
      <h3 className="titulo text-[15px] m-0 mb-4">{t('milestones.title')}</h3>

      {unico ? (
        <div className="mb-4">
          <LadderBadge label={activa.etiqueta} title={t('ladder.onlyRm')} />
        </div>
      ) : (
        //  La pestana activa ES la etiqueta: va justo encima del numero, que
        //  es donde tiene que estar para que nadie lea un pico de equipos
        //  como su elo de 1v1.
        <div className="seg mb-5" role="tablist">
          {PRESENTES.map((l) => {
            const sel = l.clave === activa.clave;
            return (
              <button
                key={l.clave}
                role="tab"
                aria-selected={sel}
                onClick={() => setAbierta(l.clave)}
                className={`font-mono !text-xs ${sel ? 'sel-activo' : ''}`}
              >
                {l.etiqueta}
              </button>
            );
          })}
        </div>
      )}

      <LadderMilestones
        peakRating={datos.peak_rating}
        peakDate={datos.peak_date}
        peakThen={datos.peak_top_percent_then}
        peakNow={datos.peak_top_percent_now}
        highestRating={datos.highest_rating}
        milestones={datos.milestones}
        accentColor={activa.color}
      />
    </div>
  );
}
