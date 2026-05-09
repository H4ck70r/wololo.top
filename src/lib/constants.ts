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
};

export function getCivName(civId: number | undefined | null): string {
  if (civId == null) return 'Unknown';
  return CIVILIZATIONS[civId] ?? `Civ ${civId}`;
}

export function getCivIcon(civId: number | undefined | null): string | null {
  if (civId == null || civId < 0) return null;
  const name = CIVILIZATIONS[civId];
  if (!name) return null;
  return `/icons/civs/${name.toLowerCase()}.png`;
}

export function cleanMapName(mapName: string | undefined | null): string {
  if (!mapName) return 'Unknown';
  return mapName.replace(/\.(rms2?|scx)$/i, '').replace(/_/g, ' ');
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

// Country code to flag emoji
export function countryFlag(code: string | undefined | null): string {
  if (!code || code.length !== 2) return '';
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}
