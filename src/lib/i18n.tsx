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
  'rivals.empty': 'Not enough 1v1 RM matches yet to work out rivals',
  'rivals.gamesPlayed': '{n} games played',

  'milestones.title': 'Rating Milestones',
  'milestones.peak': 'Peak',
  'milestones.allTime': 'all-time',
  'milestones.empty': 'Milestones appear as this player climbs the 1v1 RM ladder',
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

  'lb.title': 'Leaderboard',
  'lb.searchPlayer': 'Search Player',
  'lb.aliasPlaceholder': 'Alias or name...',
  'lb.country': 'Country',
  'lb.allCountries': 'All Countries',
  'lb.clan': 'Clan',
  'lb.clanPlaceholder': 'Clan name...',
  'lb.minRating': 'Min Rating',
  'lb.maxRating': 'Max Rating',
  'lb.noMatch': 'No players match your filters.',
  'lb.failed': 'Failed to load leaderboard data.',
  'lb.peak': 'Peak',
  'lb.wl': 'W / L',

  'meta.title': 'Civilization Meta',
  'meta.matchType': 'Match Type',
  'meta.eloBracket': 'ELO Bracket',
  'meta.timeRange': 'Time Range',
  'meta.topMatchups': 'Top Matchups',
  'meta.civA': 'Civ A',
  'meta.civB': 'Civ B',
  'meta.aWinPct': 'A Win %',
  'meta.avgDuration': 'Avg Duration',
  'meta.noData': 'No data available for these filters.',
  'meta.noMapData': 'No map data available for these filters.',

  'compare.title': 'Compare Players',
  'compare.selectTwo': 'Select two players to compare',
  'compare.player1': 'Player 1',
  'compare.player2': 'Player 2',
  'compare.ratings': 'Ratings',
  'compare.headToHead': 'Head to Head',
  'compare.soloRating': 'Solo RM Rating',
  'compare.soloRank': 'Solo RM Rank',
  'compare.teamRating': 'Team RM Rating',
  'compare.teamRank': 'Team RM Rank',
  'compare.totalGames': 'Total Games',
  'compare.overallWinRate': 'Overall Win Rate',
  'compare.winPct': 'Win %',
  'compare.remove': 'Remove',
  'compare.noCivData': 'No civ data available.',
  'compare.noMapData': 'No map data available.',

  'h2h.notFound': 'Head to Head Not Found',
  'h2h.civMatchups': 'Civilization Matchups',
  'h2h.mapStats': 'Map Stats',
  'h2h.score': 'Score',
  'h2h.noCivData': 'No civ matchup data available.',
  'h2h.noMapData': 'No map data available.',
  'h2h.noMatches': 'No matches found between these players.',

  'clan.notFound': 'Clan Not Found',
  'clan.members': 'Members',
  'clan.avgRating': 'Avg Rating',
  'clan.totalWins': 'Total Wins',
  'clan.totalLosses': 'Total Losses',

  'live.title': 'Live Matches',
  'live.none': 'No live matches detected',
  'live.autoRefresh': 'The data will refresh automatically.',
  'live.failed': 'Failed to load live matches',

  'notFound.title': 'Page Not Found',
  'favorites.title': 'Favorites',
  'favorites.remove': 'Remove from favorites',
  'chart.title': 'Rating History',
  'chart.empty': 'No rating history available yet.',
  'trends.title': 'Trends',
  'trends.empty': 'Play some ranked matches to see rating trends',
  'lb.playersFound': '{n} players found',
  'meta.winRatesAcross': 'Win rates across {n} matches',
  'live.inProgress': '{n} matches in progress',
  'clan.noPlayers': 'No players found with clan tag "{tag}".',
  'notFound.body': "The page you're looking for doesn't exist or has been moved.",
  'notFound.goHome': 'Go Home',
  'compare.searchHint': 'Search by player name, profile ID, or Steam ID.',
  'profile.noMatches': 'No recent matches found.',
  'h2h.winRateOf': '{pct}% win rate',
  'h2h.gamesCount': '{n} games',
  'h2h.winsCount': '{n} wins',
  'clan.membersCount': '{n} members',
  'clan.countriesCount': '{n} countries',
  'dist.title': 'Where you stand',
  'dist.titleOther': 'Where {who} stands',
  'dist.subtitle': '{above} players above you, out of {total} on the ladder',
  'dist.subtitleOther': '{above} players above {who}, out of {total} on the ladder',
  'dist.playersAtRating': 'players',
  'dist.median': 'median',
  'dist.top10': 'top 10%',
  'dist.top1': 'top 1%',
  'dist.top100': 'top 100',
  'dist.you': 'you',
  'dist.inThisRange': 'in this range',
  'dist.aboveIt': 'above it',
  'dist.band50': 'top 50%',
  'dist.band25': 'top 25%',
  'dist.band10': 'top 10%',
  'dist.band1': 'top 1%',
  'dist.band100': 'top 100',
  'dist.bandElite': 'elite (top 16)',
  'dist.bulk': 'average',
  'dist.rangeHint': 'Tap a range to zoom in',
  'dist.zoomAll': 'All',
  'dist.zoomLabel': 'Zoom',
  'dist.top10title': 'Top 10 of the ladder',
  'dist.top10empty': 'Leaderboard unavailable right now.',
  'dist.footnote': 'Real ladder distribution, not a bell curve: ratings are skewed, with a long tail at the top.',
  'dist.statsWhole': 'Whole ladder',
  'dist.statsRange': 'Selected range',
  'dist.statAvg': 'average',
  'dist.statMedian': 'median',
  'dist.statBottom': 'bottom',
  'dist.statTop': 'top',
  'dist.statSpread': 'spread',
  'dist.statPlayers': 'players',
  'dist.statShare': '{share}% of the ladder',
  'dist.yourPlace': 'You are #{position} of {total} here',
  'dist.theirPlace': '{who} is #{position} of {total} here',
  'dist.tiedWith': 'tied on {rating} with {count} others',
  'dist.tiedWithOne': 'tied on {rating} with 1 other',
  'dist.rangeListTitle': 'Players rated {from}–{to}',
  'dist.rangeEmpty': 'No players in this range.',
  'dist.jumpToMe': 'Go to my page',
  'dist.jumpToOther': 'Go to their page',
  'dist.playersNoun': 'players',
  'dist.backToTop10': 'Back to the top 10',
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
  'rivals.empty': 'Aún no hay suficientes partidas 1v1 RM para sacar rivales',
  'rivals.gamesPlayed': '{n} partidas jugadas',

  'milestones.title': 'Hitos de puntuación',
  'milestones.peak': 'Máximo',
  'milestones.allTime': 'histórico',
  'milestones.empty': 'Los hitos aparecen según este jugador sube en la clasificación 1v1 RM',
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

  'lb.title': 'Clasificación',
  'lb.searchPlayer': 'Buscar jugador',
  'lb.aliasPlaceholder': 'Alias o nombre...',
  'lb.country': 'País',
  'lb.allCountries': 'Todos los países',
  'lb.clan': 'Clan',
  'lb.clanPlaceholder': 'Nombre del clan...',
  'lb.minRating': 'Puntuación mínima',
  'lb.maxRating': 'Puntuación máxima',
  'lb.noMatch': 'Ningún jugador coincide con los filtros.',
  'lb.failed': 'No se pudo cargar la clasificación.',
  'lb.peak': 'Máximo',
  'lb.wl': 'V / D',

  'meta.title': 'Meta de civilizaciones',
  'meta.matchType': 'Tipo de partida',
  'meta.eloBracket': 'Rango de ELO',
  'meta.timeRange': 'Periodo',
  'meta.topMatchups': 'Mejores enfrentamientos',
  'meta.civA': 'Civ A',
  'meta.civB': 'Civ B',
  'meta.aWinPct': '% victoria de A',
  'meta.avgDuration': 'Duración media',
  'meta.noData': 'Sin datos para estos filtros.',
  'meta.noMapData': 'Sin datos de mapas para estos filtros.',

  'compare.title': 'Comparar jugadores',
  'compare.selectTwo': 'Elige dos jugadores para comparar',
  'compare.player1': 'Jugador 1',
  'compare.player2': 'Jugador 2',
  'compare.ratings': 'Puntuaciones',
  'compare.headToHead': 'Cara a cara',
  'compare.soloRating': 'Puntuación individual RM',
  'compare.soloRank': 'Puesto individual RM',
  'compare.teamRating': 'Puntuación por equipos RM',
  'compare.teamRank': 'Puesto por equipos RM',
  'compare.totalGames': 'Partidas totales',
  'compare.overallWinRate': '% de victorias global',
  'compare.winPct': '% victorias',
  'compare.remove': 'Quitar',
  'compare.noCivData': 'Sin datos de civilizaciones.',
  'compare.noMapData': 'Sin datos de mapas.',

  'h2h.notFound': 'Cara a cara no encontrado',
  'h2h.civMatchups': 'Enfrentamientos por civilización',
  'h2h.mapStats': 'Estadísticas por mapa',
  'h2h.score': 'Marcador',
  'h2h.noCivData': 'Sin datos de enfrentamientos por civilización.',
  'h2h.noMapData': 'Sin datos de mapas.',
  'h2h.noMatches': 'No hay partidas entre estos jugadores.',

  'clan.notFound': 'Clan no encontrado',
  'clan.members': 'Miembros',
  'clan.avgRating': 'Puntuación media',
  'clan.totalWins': 'Victorias totales',
  'clan.totalLosses': 'Derrotas totales',

  'live.title': 'Partidas en vivo',
  'live.none': 'No hay partidas en vivo',
  'live.autoRefresh': 'Los datos se actualizan solos.',
  'live.failed': 'No se pudieron cargar las partidas en vivo',

  'notFound.title': 'Página no encontrada',
  'favorites.title': 'Favoritos',
  'favorites.remove': 'Quitar de favoritos',
  'chart.title': 'Historial de puntuación',
  'chart.empty': 'Todavía no hay historial de puntuación.',
  'trends.title': 'Tendencias',
  'trends.empty': 'Juega partidas clasificatorias para ver tendencias',
  'lb.playersFound': '{n} jugadores encontrados',
  'meta.winRatesAcross': 'Porcentajes de victoria sobre {n} partidas',
  'live.inProgress': '{n} partidas en curso',
  'clan.noPlayers': 'No hay jugadores con la etiqueta de clan "{tag}".',
  'notFound.body': 'La página que buscas no existe o se ha movido.',
  'notFound.goHome': 'Ir al inicio',
  'compare.searchHint': 'Busca por nombre, ID de perfil o ID de Steam.',
  'profile.noMatches': 'No se encontraron partidas recientes.',
  'h2h.winRateOf': '{pct}% de victorias',
  'h2h.gamesCount': '{n} partidas',
  'h2h.winsCount': '{n} victorias',
  'clan.membersCount': '{n} miembros',
  'clan.countriesCount': '{n} países',
  'dist.title': 'Tu lugar en el ladder',
  'dist.titleOther': 'El lugar de {who} en el ladder',
  'dist.subtitle': '{above} jugadores por encima de ti, de {total} en el ladder',
  'dist.subtitleOther': '{above} jugadores por encima de {who}, de {total} en el ladder',
  'dist.playersAtRating': 'jugadores',
  'dist.median': 'mediana',
  'dist.top10': 'top 10%',
  'dist.top1': 'top 1%',
  'dist.top100': 'top 100',
  'dist.you': 'tú',
  'dist.inThisRange': 'en este tramo',
  'dist.aboveIt': 'por encima',
  'dist.band50': 'top 50%',
  'dist.band25': 'top 25%',
  'dist.band10': 'top 10%',
  'dist.band1': 'top 1%',
  'dist.band100': 'top 100',
  'dist.bandElite': 'élite (top 16)',
  'dist.bulk': 'promedio',
  'dist.rangeHint': 'Toca un rango para acercarte',
  'dist.zoomAll': 'Todo',
  'dist.zoomLabel': 'Zoom',
  'dist.top10title': 'Top 10 del ladder',
  'dist.top10empty': 'La clasificación no está disponible ahora mismo.',
  'dist.footnote': 'Distribución real del ladder, no una campana: los ratings están sesgados, con una cola larga arriba.',
  'dist.statsWhole': 'Ladder completo',
  'dist.statsRange': 'Tramo elegido',
  'dist.statAvg': 'promedio',
  'dist.statMedian': 'mediana',
  'dist.statBottom': 'mínimo',
  'dist.statTop': 'máximo',
  'dist.statSpread': 'desviación',
  'dist.statPlayers': 'jugadores',
  'dist.statShare': '{share}% del ladder',
  'dist.yourPlace': 'Estás en el puesto {position} de {total} aquí',
  'dist.theirPlace': '{who} está en el puesto {position} de {total} aquí',
  'dist.tiedWith': 'empate a {rating} con {count} más',
  'dist.tiedWithOne': 'empate a {rating} con 1 más',
  'dist.rangeListTitle': 'Jugadores entre {from} y {to}',
  'dist.rangeEmpty': 'Ningún jugador en este tramo.',
  'dist.jumpToMe': 'Ir a mi página',
  'dist.jumpToOther': 'Ir a su página',
  'dist.playersNoun': 'jugadores',
  'dist.backToTop10': 'Volver al top 10',
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
