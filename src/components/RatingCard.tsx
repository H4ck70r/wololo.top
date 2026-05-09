interface RatingCardProps {
  label: string;
  rating: number | undefined;
  rank: number | undefined;
  wins: number | undefined;
  losses: number | undefined;
  streak: number | undefined;
  highest: number | undefined;
  color: 'gold' | 'blue';
}

export default function RatingCard({
  label,
  rating,
  rank,
  wins,
  losses,
  streak,
  highest,
  color,
}: RatingCardProps) {
  if (!rating && !rank) return null;

  const winRate = wins && losses ? ((wins / (wins + losses)) * 100).toFixed(1) : '0.0';
  const totalGames = (wins || 0) + (losses || 0);

  const accentColor = color === 'gold' ? 'text-gold-400' : 'text-blue-accent';
  const accentBorder = color === 'gold' ? 'border-gold-500/30' : 'border-blue-accent/30';
  const accentBg = color === 'gold' ? 'bg-gold-500/5' : 'bg-blue-accent/5';

  return (
    <div className={`${accentBg} border ${accentBorder} rounded-xl p-5`}>
      <p className="text-sm text-gray-400 uppercase tracking-wider font-medium m-0">{label}</p>
      <div className="flex items-baseline gap-3 mt-2">
        <span className={`text-4xl font-bold ${accentColor}`}>{rating || '-'}</span>
        {rank && (
          <span className="text-sm text-gray-500">#{rank.toLocaleString()}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-gray-500 m-0">Record</p>
          <p className="text-sm font-medium m-0">
            <span className="text-win">{wins || 0}W</span>
            {' / '}
            <span className="text-loss">{losses || 0}L</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 m-0">Win Rate</p>
          <p className="text-sm font-medium m-0">{winRate}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 m-0">Games</p>
          <p className="text-sm font-medium m-0">{totalGames.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 m-0">Streak</p>
          <p className={`text-sm font-medium m-0 ${streak && streak > 0 ? 'text-win' : streak && streak < 0 ? 'text-loss' : ''}`}>
            {streak && streak > 0 ? `+${streak}` : streak || '0'}
          </p>
        </div>
      </div>

      {highest && (
        <div className="mt-3 pt-3 border-t border-dark-400">
          <p className="text-xs text-gray-500 m-0">Highest Rating</p>
          <p className={`text-sm font-bold ${accentColor} m-0`}>{highest}</p>
        </div>
      )}
    </div>
  );
}
