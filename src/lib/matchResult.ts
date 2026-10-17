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
  win: 'bg-win/[0.04] border-win/25 hover:border-win/50',
  loss: 'bg-loss/[0.04] border-loss/25 hover:border-loss/50',
  pending: 'bg-pending/[0.04] border-pending/25 hover:border-pending/50',
};
