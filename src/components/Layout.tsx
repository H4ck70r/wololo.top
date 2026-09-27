import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

const NAV_LINKS = [
  { path: '/', label: 'Search' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/stats', label: 'Stats' },
  { path: '/compare', label: 'Compare' },
  { path: '/live', label: 'Live' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the drawer on navigation, otherwise it stays over the new page.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const linkClasses = (path: string, block = false) =>
    `${block ? 'block w-full py-3' : 'py-2'} px-3 lg:px-4 rounded-lg text-sm font-medium transition-colors no-underline whitespace-nowrap ${
      location.pathname === path
        ? 'bg-dark-500 text-gold-400'
        : 'text-gray-400 hover:text-gray-200 hover:bg-dark-600'
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-dark-800 border-b border-dark-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 no-underline shrink-0">
              <span className="text-2xl font-black tracking-wider text-gold-400" style={{ fontVariant: 'small-caps' }}>
                WOLOLO
              </span>
              <span className="text-sm text-gray-400">.top</span>
            </Link>

            {/* The five links need ~330px of their own; below md they went into a
                horizontal scroller inside the header, which hid Compare and Live
                behind a swipe nobody would guess was there. */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link key={link.path} to={link.path} className={linkClasses(link.path)}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="md:hidden -mr-2 p-2.5 rounded-lg text-gray-300 hover:text-gold-400 hover:bg-dark-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>

          {menuOpen && (
            <nav id="mobile-nav" className="md:hidden pb-3 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link key={link.path} to={link.path} className={linkClasses(link.path, true)}>
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-dark-800 border-t border-dark-400 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-gold-400" style={{ fontVariant: 'small-caps' }}>
                WOLOLO
              </span>
              <span className="text-xs text-gray-500">.top</span>
            </div>
            <p className="text-sm text-gray-500 text-center sm:text-right m-0">
              Age of Empires II player statistics and analytics. Not affiliated with Xbox Game Studios.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
