import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import PlayerProfile from './pages/PlayerProfile';
import HeadToHead from './pages/HeadToHead';
import LeaderboardEnhanced from './pages/LeaderboardEnhanced';
import LiveMatches from './pages/LiveMatches';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/player/:profileId" element={<PlayerProfile />} />
        <Route path="/h2h/:profileId/:opponentId" element={<HeadToHead />} />
        <Route path="/leaderboard" element={<LeaderboardEnhanced />} />
        <Route path="/live" element={<LiveMatches />} />
      </Routes>
    </Layout>
  );
}
