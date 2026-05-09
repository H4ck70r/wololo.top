import { useQuery } from '@tanstack/react-query';
import { getPlayerMilestones } from '../lib/api';
import type { MilestonesResponse, Milestone } from '../lib/types';

interface MilestonesTimelineProps {
  profileId: string;
}

function getBracket(threshold: number): { label: string; color: string; bg: string; border: string } {
  if (threshold < 1200) return { label: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-600/20', border: 'border-amber-600/40' };
  if (threshold < 1600) return { label: 'Silver', color: 'text-gray-300', bg: 'bg-gray-300/20', border: 'border-gray-300/40' };
  if (threshold < 2000) return { label: 'Gold', color: 'text-gold-400', bg: 'bg-gold-400/20', border: 'border-gold-400/40' };
  if (threshold < 2400) return { label: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-400/20', border: 'border-cyan-400/40' };
  return { label: 'Legend', color: 'text-purple-400', bg: 'bg-purple-400/20', border: 'border-purple-400/40' };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
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
  label: string;
  peakRating: number | null;
  peakDate: string | null;
  highestRating: number | null;
  milestones: Milestone[];
  accentColor: string;
}) {
  const displayPeak = Math.max(peakRating || 0, highestRating || 0) || null;
  const peakIsFromLadder = highestRating && (!peakRating || highestRating > peakRating);

  if (!displayPeak && milestones.length === 0) return null;

  return (
    <div className="flex-1 min-w-0">
      <h4 className={`text-sm font-semibold uppercase tracking-wider ${accentColor} mb-4`}>
        {label}
      </h4>

      {/* Peak rating */}
      {displayPeak && (
        <div className="mb-5 flex items-baseline gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Peak</span>
          <span className={`text-2xl font-bold ${accentColor}`}>{displayPeak}</span>
          {peakDate && !peakIsFromLadder && (
            <span className="text-xs text-gray-500">on {formatDate(peakDate)}</span>
          )}
          {peakIsFromLadder && (
            <span className="text-xs text-gray-500">all-time</span>
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
                    <span className="text-xs text-gray-500">{formatDate(m.reached_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {milestones.length === 0 && displayPeak && (
        <p className="text-xs text-gray-500 italic">No milestone crossings in tracked history.</p>
      )}
    </div>
  );
}

export default function MilestonesTimeline({ profileId }: MilestonesTimelineProps) {
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

  const rm = data.ladders.rm;
  const teamRm = data.ladders.team_rm;

  if (!rm && !teamRm) return null;

  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-gray-200 m-0 mb-5">Rating Milestones</h3>

      <div className="flex flex-col sm:flex-row gap-6">
        {rm && (
          <LadderMilestones
            label="Solo RM"
            peakRating={rm.peak_rating}
            peakDate={rm.peak_date}
            highestRating={rm.highest_rating}
            milestones={rm.milestones}
            accentColor="text-gold-400"
          />
        )}
        {teamRm && (
          <LadderMilestones
            label="Team RM"
            peakRating={teamRm.peak_rating}
            peakDate={teamRm.peak_date}
            highestRating={teamRm.highest_rating}
            milestones={teamRm.milestones}
            accentColor="text-blue-accent"
          />
        )}
      </div>
    </div>
  );
}
