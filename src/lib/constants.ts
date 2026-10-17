export const CIVILIZATIONS: Record<number, string> = {
  0: 'Armenians',
  1: 'Aztecs',
  2: 'Bengalis',
  3: 'Berbers',
  4: 'Bohemians',
  5: 'Britons',
  6: 'Bulgarians',
  7: 'Burgundians',
  8: 'Burmese',
  9: 'Byzantines',
  10: 'Celts',
  11: 'Chinese',
  12: 'Cumans',
  13: 'Dravidians',
  14: 'Ethiopians',
  15: 'Franks',
  16: 'Georgians',
  17: 'Goths',
  18: 'Gurjaras',
  19: 'Huns',
  20: 'Incas',
  21: 'Hindustanis',
  22: 'Italians',
  23: 'Japanese',
  24: 'Khmer',
  25: 'Koreans',
  26: 'Lithuanians',
  27: 'Magyars',
  28: 'Malay',
  29: 'Malians',
  30: 'Mayans',
  31: 'Mongols',
  32: 'Persians',
  33: 'Poles',
  34: 'Portuguese',
  35: 'Romans',
  36: 'Saracens',
  37: 'Sicilians',
  38: 'Slavs',
  39: 'Spanish',
  40: 'Tatars',
  41: 'Teutons',
  42: 'Turks',
  43: 'Vietnamese',
  44: 'Vikings',
  45: 'Achaemenids',
  46: 'Athenians',
  47: 'Spartans',
  48: 'Shu',
  49: 'Wu',
  50: 'Wei',
  51: 'Jurchens',
  52: 'Khitans',
  55: 'Macedonians',
  56: 'Thracians',
  57: 'Puru',
  58: 'Muisca',
  59: 'Mapuche',
  60: 'Tupi',
  // Verified against aoe2companion's civName for the same match+profile that
  // World's Edge tagged with these ids (see the API's aoe2Normalize.js).
  61: 'Saxons',
  62: 'Varangians',
  63: 'Danes',
};

// World's Edge reassigned civilization ids: until May 2025 Jurchens and
// Khitans were 53 and 54, today they are 51 and 52. Old matches still carry
// the retired ids, so they are resolved here too (the API does the same in
// aoe2Normalize.js).
const HISTORIC_CIV_IDS: Record<number, number> = { 53: 51, 54: 52 };

export function normalizeCivId(civId: number): number {
  return HISTORIC_CIV_IDS[civId] ?? civId;
}

/*
  Los nombres en castellano, los del juego en su version en espanol. Antes la
  pagina en castellano decia "Romans" y "Magyars" al lado de texto en
  espanol. El icono sigue saliendo del nombre ingles (es el nombre del fichero).
*/
const CIVILIZACIONES_ES: Record<number, string> = {
  0: 'Armenios',
  1: 'Aztecas',
  2: 'Bengalíes',
  3: 'Bereberes',
  4: 'Bohemios',
  5: 'Britanos',
  6: 'Búlgaros',
  7: 'Borgoñones',
  8: 'Birmanos',
  9: 'Bizantinos',
  10: 'Celtas',
  11: 'Chinos',
  12: 'Cumanos',
  13: 'Drávidas',
  14: 'Etíopes',
  15: 'Francos',
  16: 'Georgianos',
  17: 'Godos',
  18: 'Gurjaras',
  19: 'Hunos',
  20: 'Incas',
  21: 'Indostaníes',
  22: 'Italianos',
  23: 'Japoneses',
  24: 'Jemeres',
  25: 'Coreanos',
  26: 'Lituanos',
  27: 'Magiares',
  28: 'Malayos',
  29: 'Malíes',
  30: 'Mayas',
  31: 'Mongoles',
  32: 'Persas',
  33: 'Polacos',
  34: 'Portugueses',
  35: 'Romanos',
  36: 'Sarracenos',
  37: 'Sicilianos',
  38: 'Eslavos',
  39: 'Españoles',
  40: 'Tártaros',
  41: 'Teutones',
  42: 'Turcos',
  43: 'Vietnamitas',
  44: 'Vikingos',
  45: 'Aqueménidas',
  46: 'Atenienses',
  47: 'Espartanos',
  48: 'Shu',
  49: 'Wu',
  50: 'Wei',
  51: 'Yurchen',
  52: 'Kitán',
  55: 'Macedonios',
  56: 'Tracios',
  57: 'Puru',
  58: 'Muiscas',
  59: 'Mapuches',
  60: 'Tupís',
  61: 'Sajones',
  62: 'Varegos',
  63: 'Daneses',
};

//  El idioma en el que se nombran las civs. Lo fija el proveedor de i18n en el
//  mismo momento en que se elige, antes de pintar, para que no haya un primer
//  render en ingles.
let idiomaCivs: 'en' | 'es' = 'en';
export function fijarIdiomaCivs(l: 'en' | 'es') {
  idiomaCivs = l;
}

export function getCivName(civId: number | undefined | null): string {
  if (civId == null) return 'Unknown';
  const id = normalizeCivId(civId);
  if (idiomaCivs === 'es' && CIVILIZACIONES_ES[id]) return CIVILIZACIONES_ES[id];
  return CIVILIZATIONS[id] ?? `Civ ${civId}`;
}

export function getCivIcon(civId: number | undefined | null): string | null {
  if (civId == null || civId < 0) return null;
  const name = CIVILIZATIONS[normalizeCivId(civId)];
  if (!name) return null;
  return `/icons/civs/${name.toLowerCase()}.png`;
}

// Keep in sync with cleanMapName in the API (src/utils/aoe2Normalize.js):
// map_name is stored canonically (lowercase, "_"-separated), so the display
// name has to be title-cased here too or maps render as "arabia".
export function cleanMapName(mapName: string | undefined | null): string {
  if (!mapName) return 'Unknown';
  if (mapName === 'my map' || mapName === 'my_map') return 'Custom Map';
  return mapName
    .replace(/\.(rms2?|scx)$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDuration(seconds: number | undefined | null): string {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export function formatTimeAgo(timestamp: number | undefined | null): string {
  if (!timestamp) return '-';
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDate(timestamp: number | undefined | null): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const MATCH_FILTERS = [
  { label: 'All', value: '' },
  { label: '1v1 RM', value: '6' },
  { label: 'Team RM', value: '7,8,9' },
  { label: '1v1 EW', value: '26' },
  { label: 'Team EW', value: '27,28,29' },
  { label: '1v1 DM', value: '2' },
  { label: 'Team DM', value: '3,4,5' },
  { label: 'Unranked', value: '0' },
] as const;

// Country code to flag emoji
const regionNames = new Map<string, Intl.DisplayNames>();

/**
 * The country name in the reader's language, from the browser itself, so no
 * 250-row table has to be shipped or translated. Unknown or malformed codes
 * fall back to the code, which is still better than nothing.
 */
export function countryName(code: string | undefined | null, lang = 'en'): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  try {
    let names = regionNames.get(lang);
    if (!names) {
      names = new Intl.DisplayNames([lang], { type: 'region' });
      regionNames.set(lang, names);
    }
    return names.of(upper) ?? upper;
  } catch {
    return upper;
  }
}

/** Lowercased and stripped of accents, so "mexico" finds "México". */
export function foldText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

