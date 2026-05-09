import { useQuery } from '@tanstack/react-query';
import { getLiveMatches } from '../lib/api';
import LiveMatchCard from '../components/LiveMatchCard';

export default function LiveMatches() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['liveMatches'],
    queryFn: getLiveMatches,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const matches = data?.matches || [];
  const total = data?.total ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-100 m-0">Live Matches</h1>
            <span className="relative flex h-3 w-3 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 m-0">
            {isLoading ? 'Loading...' : `${total} match${total !== 1 ? 'es' : ''} in progress`}
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-loss/10 border border-loss/20 rounded-xl p-6 text-center">
          <p className="text-loss font-medium m-0">Failed to load live matches</p>
          <p className="text-sm text-gray-500 mt-1 m-0">The data will refresh automatically.</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-dark-700 border border-dark-400 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-12 h-5 bg-dark-500 rounded-full" />
                <div className="w-16 h-5 bg-dark-500 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-dark-500 rounded" />
                  <div className="w-24 h-4 bg-dark-500 rounded" />
                </div>
                <div className="space-y-2 border-l border-dark-400 pl-4">
                  <div className="w-32 h-4 bg-dark-500 rounded" />
                  <div className="w-24 h-4 bg-dark-500 rounded" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-dark-400/50">
                <div className="w-20 h-3 bg-dark-500 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && matches.length === 0 && (
        <div className="bg-dark-700 border border-dark-400 rounded-xl p-12 text-center">
          <svg className="w-16 h-16 text-dark-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <p className="text-gray-400 font-medium m-0">No live matches detected</p>
          <p className="text-sm text-gray-500 mt-1 m-0">
            This page refreshes automatically every 30 seconds.
          </p>
        </div>
      )}

      {/* Match grid */}
      {!isLoading && matches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matches.map((match) => (
            <LiveMatchCard key={match.lobby_id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
