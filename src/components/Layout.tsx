import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Search' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/stats', label: 'Stats' },
    { path: '/compare', label: 'Compare' },
    { path: '/live', label: 'Live' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <span className="text-2xl font-black tracking-wider text-gold-400" style={{ fontVariant: 'small-caps' }}>
                WOLOLO
              </span>
              <span className="text-sm text-gray-400">.top</span>
            </Link>

            <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors no-underline whitespace-nowrap shrink-0 ${
                    location.pathname === link.path
                      ? 'bg-dark-500 text-gold-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-dark-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-dark-800 border-t border-dark-400 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-gold-400" style={{ fontVariant: 'small-caps' }}>
                WOLOLO
              </span>
              <span className="text-xs text-gray-500">.top</span>
            </div>
            <p className="text-sm text-gray-500">
              Age of Empires II player statistics and analytics. Not affiliated with Xbox Game Studios.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
