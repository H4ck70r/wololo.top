// The API reports a match outcome as 1 = win, 0 = loss, -1 = unknown.
//
// "Unknown" means the match has not been decided upstream yet (it also comes
// with a null duration and null ratings). It is NOT a loss: rendering it as one
// is what used to show a won game as a defeat.
export type MatchOutcome = 'win' | 'loss' | 'pending';

export function outcomeOf(result: number | null | undefined): MatchOutcome {
  if (result === 1) return 'win';
  if (result === 0) return 'loss';
  return 'pending';
}

export const OUTCOME_LABEL: Record<MatchOutcome, string> = {
  win: 'Win',
  loss: 'Loss',
  pending: 'Result pending',
};

export const OUTCOME_BADGE: Record<MatchOutcome, string> = {
  win: 'W',
  loss: 'L',
  pending: '?',
};

// Tailwind class fragments, so every surface renders the three states alike.
export const OUTCOME_CHIP: Record<MatchOutcome, string> = {
  win: 'bg-win/20 text-win',
  loss: 'bg-loss/20 text-loss',
  pending: 'bg-pending/20 text-pending',
};

export const OUTCOME_CARD: Record<MatchOutcome, string> = {
  win: 'bg-win/5 border-win/20 hover:border-win/40 border-l-green-500',
  loss: 'bg-loss/5 border-loss/20 hover:border-loss/40 border-l-red-500',
  pending: 'bg-pending/5 border-pending/20 hover:border-pending/40 border-l-slate-400',
};
