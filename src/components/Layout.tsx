import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useT, LANGS } from '../lib/i18n';
import { useSession } from '../lib/session';
import SteamButton from './SteamButton';
import Wordmark from './Wordmark';
import type { TKey } from '../lib/i18n';

type Enlace = { path: string; key: TKey };
type Grupo = { grupo: TKey; enlaces: Enlace[] };
type Entrada = Enlace | Grupo;

const esGrupo = (e: Entrada): e is Grupo => 'grupo' in e;

/*
  El menu, por temas y no en fila.

  Eran ocho enlaces sueltos y ya no cabian en una barra: a esa altura el que
  llega no lee el menu, lo barre. Agrupados son cuatro cosas, y cada una dice
  de que va sin tener que entrar.

  El manual sale de aqui a proposito. No es una seccion del sitio, es la ayuda
  de una herramienta concreta, asi que vive dentro de su pagina; quien busca el
  manual viene de haberla descargado, no del menu.
*/
const NAV: Entrada[] = [
  {
    grupo: 'nav.g.players',
    enlaces: [
      { path: '/', key: 'nav.search' },
      { path: '/leaderboard', key: 'nav.leaderboard' },
      { path: '/compare', key: 'nav.compare' },
    ],
  },
  {
    grupo: 'nav.g.matches',
    enlaces: [
      { path: '/live', key: 'nav.live' },
      //  El analizador se queda arriba del todo de su grupo: es la puerta de
      //  entrada para quien llega sin cuenta y sin saber que existimos.
      { path: '/analyze', key: 'nav.analyze' },
    ],
  },
  { path: '/stats', key: 'nav.stats' },
  { path: '/overlay', key: 'nav.overlay' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);
  const { t, lang, setLang } = useT();
  const { user, loading: sessionLoading, signIn, signOut } = useSession();

  // Close the drawer on navigation, otherwise it stays over the new page.
  useEffect(() => {
    setMenuOpen(false);
    setAbierto(null);
  }, [location.pathname]);

  //  Un desplegable abierto tiene que cerrarse al pulsar fuera y con Escape, o
  //  se queda tapando la pagina hasta que alguien acierte a darle otra vez.
  useEffect(() => {
    if (!abierto) return;
    const fuera = () => setAbierto(null);
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(null);
    document.addEventListener('click', fuera);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('click', fuera);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  const linkClasses = (path: string, block = false) =>
    block
      ? `block w-full py-3 px-3 text-[15px] font-medium no-underline border-l-2 transition-colors ${
          location.pathname === path
            ? 'border-gold-400 text-gray-50 bg-dark-700'
            : 'border-transparent text-gray-300 hover:text-gray-50'
        }`
      : `relative flex items-center h-16 px-3 lg:px-4 text-[15px] font-medium no-underline whitespace-nowrap transition-colors after:absolute after:left-3 after:right-3 lg:after:left-4 lg:after:right-4 after:bottom-0 after:h-[2px] ${
          location.pathname === path
            ? 'text-gray-50 after:bg-gold-400'
            : 'text-gray-400 hover:text-gray-50 after:bg-transparent hover:after:bg-dark-300'
        }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-dark-900 border-b border-dark-400 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center no-underline shrink-0" aria-label="wololo.top">
              <Wordmark />
            </Link>

            {/* The five links need ~330px of their own; below md they went into a
                horizontal scroller inside the header, which hid Compare and Live
                behind a swipe nobody would guess was there. */}
            <nav className="hidden md:flex items-stretch ml-auto">
              {NAV.map((entrada) => {
                if (!esGrupo(entrada)) {
                  return (
                    <Link
                      key={entrada.path}
                      to={entrada.path}
                      className={linkClasses(entrada.path)}
                    >
                      {t(entrada.key)}
                    </Link>
                  );
                }
                const activo = entrada.enlaces.some((l) => l.path === location.pathname);
                const open = abierto === entrada.grupo;
                return (
                  <div key={entrada.grupo} className="relative">
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-haspopup="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAbierto(open ? null : entrada.grupo);
                      }}
                      className={`relative flex items-center gap-1 h-16 px-3 lg:px-4 text-[15px] font-medium transition-colors whitespace-nowrap after:absolute after:left-3 after:right-3 lg:after:left-4 lg:after:right-4 after:bottom-0 after:h-[2px] ${
                        activo
                          ? 'text-gray-50 after:bg-gold-400'
                          : open
                            ? 'text-gray-50 after:bg-dark-300'
                            : 'text-gray-400 hover:text-gray-50 after:bg-transparent hover:after:bg-dark-300'
                      }`}
                    >
                      {t(entrada.grupo)}
                      <svg
                        className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {open && (
                      <div className="absolute left-0 top-full z-50 min-w-48 border border-dark-400 border-t-gold-400/70 bg-dark-800 py-1 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.7)]">
                        {entrada.enlaces.map((l) => (
                          <Link
                            key={l.path}
                            to={l.path}
                            className={`block px-4 py-2.5 text-[15px] no-underline transition-colors ${
                              location.pathname === l.path
                                ? 'bg-dark-600 text-gold-400'
                                : 'text-gray-300 hover:bg-dark-700 hover:text-gray-50'
                            }`}
                          >
                            {t(l.key)}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center ml-3 pl-3 border-l border-dark-400 h-6 font-mono text-xs">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLang(l.id)}
                  aria-label={`${t('nav.language')}: ${l.label}`}
                  aria-pressed={lang === l.id}
                  className={`px-1.5 py-1 transition-colors ${
                    lang === l.id ? 'text-gold-400' : 'text-gray-500 hover:text-gray-200'
                  }`}
                >
                  {l.id.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center ml-3 pl-3 border-l border-dark-400 h-6">
              <SteamButton
                user={user}
                loading={sessionLoading}
                onSignIn={signIn}
                onSignOut={signOut}
              />
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              className="md:hidden -mr-2 p-2.5 text-gray-200 hover:text-gold-400 transition-colors"
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
            <nav id="mobile-nav" className="md:hidden pb-4 flex flex-col">
              {/*  En el cajon no hacen falta desplegables: hay sitio de sobra
                   y un titulo por grupo basta para orientarse. */}
              {NAV.map((entrada) =>
                esGrupo(entrada) ? (
                  <div key={entrada.grupo} className="pt-2 first:pt-0">
                    <p className="px-3 pt-1 pb-1.5 font-display text-xs font-semibold tracking-[0.14em] uppercase text-gray-500">
                      {t(entrada.grupo)}
                    </p>
                    {entrada.enlaces.map((l) => (
                      <Link key={l.path} to={l.path} className={linkClasses(l.path, true)}>
                        {t(l.key)}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={entrada.path}
                    to={entrada.path}
                    className={linkClasses(entrada.path, true)}
                  >
                    {t(entrada.key)}
                  </Link>
                )
              )}
              <div className="pt-2 mt-1 border-t border-dark-400">
                <SteamButton
                  user={user}
                  loading={sessionLoading}
                  onSignIn={signIn}
                  onSignOut={signOut}
                  onNavigate={() => setMenuOpen(false)}
                  block
                />
              </div>
              <div className="flex items-center gap-2 pt-2 mt-1 border-t border-dark-400">
                <span className="px-3 font-display text-xs font-semibold tracking-[0.14em] uppercase text-gray-500">{t('nav.language')}</span>
                {LANGS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => { setLang(l.id); setMenuOpen(false); }}
                    aria-pressed={lang === l.id}
                    className={`px-3 py-2 text-[15px] font-medium transition-colors ${
                      lang === l.id ? 'text-gold-400' : 'text-gray-400 hover:text-gray-50'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-dark-400 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-8 md:grid-cols-[1fr_auto_auto] md:items-start">
          <div>
            <Wordmark />
            <p className="text-sm text-gray-500 mt-3 mb-0 max-w-sm">{t('footer.tagline')}</p>
          </div>

          {/* Las otras dos herramientas, recomendadas por lo que HACEN y no por
              de quién son: a nadie le sirve saber quién las escribió, le sirve
              saber si resuelven su problema. En el pie y no en un banner: el
              que llega aquí viene a mirar datos, no a que le interrumpan. */}
          {[
            { href: 'https://smurfs.wololo.top', title: t('promo.smurfsTitle'), what: t('promo.smurfsWhat') },
            { href: 'https://kontra.gg', title: t('promo.kontraTitle'), what: t('promo.kontraWhat') },
          ].map((p) => (
            <a
              key={p.href}
              href={p.href}
              className="group no-underline md:max-w-64 md:border-l md:border-dark-400 md:pl-6"
              target="_blank"
              rel="noopener"
            >
              <span className="block text-[15px] font-semibold text-gray-200 group-hover:text-gold-400 transition-colors">
                {p.title} <span aria-hidden="true">→</span>
              </span>
              <span className="block text-sm text-gray-500 mt-1">{p.what}</span>
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
