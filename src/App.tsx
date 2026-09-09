import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const PlayerProfile = lazy(() => import('./pages/PlayerProfile'));
const HeadToHead = lazy(() => import('./pages/HeadToHead'));
const LeaderboardEnhanced = lazy(() => import('./pages/LeaderboardEnhanced'));
const LiveMatches = lazy(() => import('./pages/LiveMatches'));
const Compare = lazy(() => import('./pages/Compare'));
const CivMeta = lazy(() => import('./pages/CivMeta'));
const ClanProfile = lazy(() => import('./pages/ClanProfile'));
const MatchDetailPage = lazy(() => import('./pages/MatchDetailPage'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/player/:profileId" element={<PlayerProfile />} />
          <Route path="/h2h/:profileId/:opponentId" element={<HeadToHead />} />
          <Route path="/leaderboard" element={<LeaderboardEnhanced />} />
          <Route path="/live" element={<LiveMatches />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/stats" element={<CivMeta />} />
          <Route path="/clan/:clanName" element={<ClanProfile />} />
          <Route path="/match/:matchId" element={<MatchDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
