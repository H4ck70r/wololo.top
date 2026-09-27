// Marks a section whose numbers come from a single ladder. Rivals highlights
// and rating milestones are 1v1 Ranked RM only, and saying so inline stops the
// figures from looking wrong to someone who also plays team, DM or Empire Wars.
export default function LadderBadge({
  label = '1v1 RM',
  title = 'Only ranked 1v1 Random Map matches count toward this',
}: {
  label?: string | null;
  title?: string;
}) {
  if (!label) return null;
  return (
    <span
      title={title}
      className="text-[10px] font-medium uppercase tracking-wider text-gold-400/80 bg-gold-500/10 border border-gold-500/25 rounded px-1.5 py-0.5 whitespace-nowrap"
    >
      {label}
    </span>
  );
}
