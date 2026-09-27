import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Lang = 'en' | 'es';

export const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'es', label: 'Español', flag: '🇲🇽' },
];

const STORAGE_KEY = 'wololo.lang';

// English is the source of truth: every key lives here, and Spanish only
// overrides. A missing Spanish key falls back to English rather than showing
// the raw key to the user.
const EN = {
  'nav.search': 'Search',
  'nav.leaderboard': 'Leaderboard',
  'nav.stats': 'Stats',
  'nav.compare': 'Compare',
  'nav.live': 'Live',
  'nav.openMenu': 'Open menu',
  'nav.closeMenu': 'Close menu',
  'nav.language': 'Language',

  'footer.tagline': 'Age of Empires II player statistics and analytics. Not affiliated with Xbox Game Studios.',

  'common.loading': 'Loading',
  'common.games': 'Games',
  'common.wins': 'Wins',
  'common.losses': 'Losses',
  'common.winRate': 'Win Rate',
  'common.winRateShort': 'WR',
  'common.record': 'Record',
  'common.streak': 'Streak',
  'common.rating': 'Rating',
  'common.rank': 'Rank',
  'common.player': 'Player',
  'common.players': 'Players',
  'common.map': 'Map',
  'common.maps': 'maps',
  'common.civilization': 'Civilization',
  'common.civilizationShort': 'Civ',
  'common.civilizations': 'civilizations',
  'common.duration': 'Duration',
  'common.mode': 'Mode',
  'common.lastPlayed': 'Last Played',
  'common.previous': 'Prev',
  'common.next': 'Next',
  'common.page': 'Page',
  'common.of': 'of',
  'common.all': 'All',
  'common.topPercent': 'top',
  'common.noData': 'No data available.',

  'profile.tab.overview': 'Overview',
  'profile.tab.matches': 'Matches',
  'profile.tab.stats': 'Civs & Maps',
  'profile.tab.rivals': 'Rivals',
  'profile.aka': 'aka',
  'profile.profileId': 'Profile ID',
  'profile.recentForm': 'Recent Form',
  'profile.soloRanked': 'Solo Ranked',
  'profile.teamRanked': 'Team Ranked',
  'profile.overallWinRate': 'Overall Win Rate',
  'profile.recentMatches': 'Recent Matches',
  'profile.notFound': 'Player Not Found',
  'profile.ladderSize': 'of {total} ranked players',

  'civStats.title': 'Civilization Stats',
  'mapStats.title': 'Map Stats',
  'stats.basedOn': 'Based on {n} matches',

  'rivals.title': 'Rivals',
  'rivals.mostPlayed': 'Most Played',
  'rivals.nemesis': 'Nemesis',
  'rivals.bestMatchup': 'Best Matchup',
  'rivals.topOpponents': 'Top Opponents',
  'rivals.uniqueOpponents': '{n} unique opponents',
  'rivals.empty': 'Play more matches to discover your rivals',
  'rivals.gamesPlayed': '{n} games played',

  'milestones.title': 'Rating Milestones',
  'milestones.peak': 'Peak',
  'milestones.allTime': 'all-time',
  'milestones.empty': 'Rating milestones will appear as you climb the 1v1 RM ladder',
  'milestones.none': 'No milestone crossings in tracked history.',

  'activity.title': 'Activity Patterns',
  'activity.tracked': '{n} tracked matches',
  'activity.mostActive': 'Most active',
  'activity.peakHour': 'Peak hour',
  'activity.peakDay': 'Peak day',
  'activity.less': 'Less',
  'activity.more': 'More',

  'ladder.onlyRm': 'Only ranked 1v1 Random Map matches count toward this',

  'match.victory': 'VICTORY',
  'match.defeat': 'DEFEAT',
  'match.undecided': 'UNDECIDED',
  'match.details': 'Match details',
  'match.resultPending': 'Result pending',
  'match.win': 'Win',
  'match.loss': 'Loss',
  'match.winners': 'Winners',
  'match.losers': 'Losers',
  'match.undecidedTeam': 'Undecided',
} as const;

export type TKey = keyof typeof EN;

const ES: Partial<Record<TKey, string>> = {
  'nav.search': 'Buscar',
  'nav.leaderboard': 'Clasificación',
  'nav.stats': 'Estadísticas',
  'nav.compare': 'Comparar',
  'nav.live': 'En vivo',
  'nav.openMenu': 'Abrir menú',
  'nav.closeMenu': 'Cerrar menú',
  'nav.language': 'Idioma',

  'footer.tagline': 'Estadísticas y análisis de jugadores de Age of Empires II. Sin afiliación con Xbox Game Studios.',

  'common.loading': 'Cargando',
  'common.games': 'Partidas',
  'common.wins': 'Victorias',
  'common.losses': 'Derrotas',
  'common.winRate': '% Victorias',
  'common.winRateShort': '%V',
  'common.record': 'Registro',
  'common.streak': 'Racha',
  'common.rating': 'Puntuación',
  'common.rank': 'Puesto',
  'common.player': 'Jugador',
  'common.players': 'Jugadores',
  'common.map': 'Mapa',
  'common.maps': 'mapas',
  'common.civilization': 'Civilización',
  'common.civilizationShort': 'Civ',
  'common.civilizations': 'civilizaciones',
  'common.duration': 'Duración',
  'common.mode': 'Modo',
  'common.lastPlayed': 'Última partida',
  'common.previous': 'Anterior',
  'common.next': 'Siguiente',
  'common.page': 'Página',
  'common.of': 'de',
  'common.all': 'Todo',
  'common.topPercent': 'top',
  'common.noData': 'Sin datos disponibles.',

  'profile.tab.overview': 'Resumen',
  'profile.tab.matches': 'Partidas',
  'profile.tab.stats': 'Civs y mapas',
  'profile.tab.rivals': 'Rivales',
  'profile.aka': 'alias',
  'profile.profileId': 'ID de perfil',
  'profile.recentForm': 'Forma reciente',
  'profile.soloRanked': 'Individual clasificatoria',
  'profile.teamRanked': 'Por equipos clasificatoria',
  'profile.overallWinRate': '% de victorias global',
  'profile.recentMatches': 'Partidas recientes',
  'profile.notFound': 'Jugador no encontrado',
  'profile.ladderSize': 'de {total} jugadores clasificados',

  'civStats.title': 'Estadísticas por civilización',
  'mapStats.title': 'Estadísticas por mapa',
  'stats.basedOn': 'Sobre {n} partidas',

  'rivals.title': 'Rivales',
  'rivals.mostPlayed': 'Más jugado',
  'rivals.nemesis': 'Némesis',
  'rivals.bestMatchup': 'Mejor rival',
  'rivals.topOpponents': 'Oponentes principales',
  'rivals.uniqueOpponents': '{n} oponentes distintos',
  'rivals.empty': 'Juega más partidas para descubrir a tus rivales',
  'rivals.gamesPlayed': '{n} partidas jugadas',

  'milestones.title': 'Hitos de puntuación',
  'milestones.peak': 'Máximo',
  'milestones.allTime': 'histórico',
  'milestones.empty': 'Los hitos aparecerán según subas en la clasificación 1v1 RM',
  'milestones.none': 'Sin hitos en el historial registrado.',

  'activity.title': 'Patrones de actividad',
  'activity.tracked': '{n} partidas registradas',
  'activity.mostActive': 'Más activo',
  'activity.peakHour': 'Hora punta',
  'activity.peakDay': 'Día punta',
  'activity.less': 'Menos',
  'activity.more': 'Más',

  'ladder.onlyRm': 'Solo cuentan las partidas clasificatorias 1v1 de mapa aleatorio',

  'match.victory': 'VICTORIA',
  'match.defeat': 'DERROTA',
  'match.undecided': 'SIN RESOLVER',
  'match.details': 'Detalles de la partida',
  'match.resultPending': 'Resultado pendiente',
  'match.win': 'Victoria',
  'match.loss': 'Derrota',
  'match.winners': 'Ganan',
  'match.losers': 'Pierden',
  'match.undecidedTeam': 'Sin resolver',
};

const DICTS: Record<Lang, Partial<Record<TKey, string>>> = { en: EN, es: ES };

function readStored(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'es') return v;
  } catch {
    // private mode / blocked storage: fall through to the default
  }
  return 'en'; // English is the default; the picker is how you opt into Spanish
}

interface I18n {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readStored());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // not being able to remember the choice must not break switching it
    }
  }, []);

  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>) => {
      let out: string = DICTS[lang][key] ?? EN[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
      }
      return out;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used inside <I18nProvider>');
  return ctx;
}
