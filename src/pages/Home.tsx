import { Helmet } from 'react-helmet-async';
import SearchBar from '../components/SearchBar';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-8rem)]">
      <Helmet>
        <title>wololo.top - Age of Empires II Player Stats & Analytics</title>
        <meta name="description" content="Search any AOE2 DE player by name, Steam ID, or profile ID. Track ratings, match history, civilization stats, rivals, and activity patterns." />
        <link rel="canonical" href="https://wololo.top" />
      </Helmet>
      {/* Hero section */}
      <div className="relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-700 via-dark-800 to-dark-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,168,67,0.08)_0%,transparent_70%)]" />

        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-24 text-center">
          {/* Logo */}
          <h1 className="text-6xl sm:text-7xl font-black tracking-wider text-gold-400 mb-2" style={{ fontVariant: 'small-caps' }}>
            WOLOLO
          </h1>
          <p className="text-xl text-gray-400 mb-2">.top</p>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-10">
            Age of Empires II player statistics, match history, and head-to-head analysis.
          </p>

          {/* Search */}
          <SearchBar large className="max-w-2xl mx-auto" />

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 sm:gap-12 mt-12">
            <StatBadge value="322K+" label="Players Tracked" />
            <div className="w-px h-10 bg-dark-400" />
            <StatBadge value="50M+" label="Matches Analyzed" />
            <div className="w-px h-10 bg-dark-400 hidden sm:block" />
            <StatBadge value="44" label="Civilizations" className="hidden sm:block" />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <FeatureCard
            title="Player Profiles"
            description="Detailed stats including rating history, civilization preferences, and map win rates."
            icon={
              <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <FeatureCard
            title="Head to Head"
            description="Compare any two players. See their historical matchup, civ choices, and map stats."
            icon={
              <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <FeatureCard
            title="Leaderboards"
            description="Global rankings for Solo and Team Ranked. See who dominates the ladder."
            icon={
              <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}

function StatBadge({ value, label, className = '' }: { value: string; label: string; className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <p className="text-2xl font-bold text-gold-400 m-0">{value}</p>
      <p className="text-xs text-gray-500 mt-1 m-0">{label}</p>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="bg-dark-700 border border-dark-400 rounded-xl p-6 hover:border-gold-500/30 transition-all">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-200 mb-2 m-0">{title}</h3>
      <p className="text-sm text-gray-400 m-0 leading-relaxed">{description}</p>
    </div>
  );
}
