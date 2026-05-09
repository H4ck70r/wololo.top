export const CIVILIZATIONS: Record<number, string> = {
  0: 'Britons',
  1: 'Franks',
  2: 'Goths',
  3: 'Teutons',
  4: 'Japanese',
  5: 'Chinese',
  6: 'Byzantines',
  7: 'Persians',
  8: 'Saracens',
  9: 'Turks',
  10: 'Vikings',
  11: 'Mongols',
  12: 'Celts',
  13: 'Spanish',
  14: 'Aztecs',
  15: 'Mayans',
  16: 'Huns',
  17: 'Koreans',
  18: 'Italians',
  19: 'Indians',
  20: 'Incas',
  21: 'Magyars',
  22: 'Slavs',
  23: 'Portuguese',
  24: 'Ethiopians',
  25: 'Malians',
  26: 'Berbers',
  27: 'Khmer',
  28: 'Malay',
  29: 'Vietnamese',
  30: 'Bulgarians',
  31: 'Cumans',
  32: 'Lithuanians',
  33: 'Tatars',
  34: 'Burgundians',
  35: 'Sicilians',
  36: 'Bohemians',
  37: 'Poles',
  38: 'Dravidians',
  39: 'Bengalis',
  40: 'Gurjaras',
  41: 'Romans',
  42: 'Armenians',
  43: 'Georgians',
};

export function getCivName(civId: number | undefined | null): string {
  if (civId == null) return 'Unknown';
  return CIVILIZATIONS[civId] ?? `Civ ${civId}`;
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
