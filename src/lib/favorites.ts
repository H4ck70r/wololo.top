const STORAGE_KEY = 'wololo_favorites';
const MAX_FAVORITES = 10;

export interface FavoritePlayer {
  profileId: number;
  alias: string;
  country: string | null;
  rating: number | null;
  avatar: string | null;
  addedAt: number;
}

export function getFavorites(): FavoritePlayer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function addFavorite(player: Omit<FavoritePlayer, 'addedAt'>): boolean {
  const favorites = getFavorites();
  if (favorites.length >= MAX_FAVORITES) return false;
  if (favorites.some((f) => f.profileId === player.profileId)) return false;
  favorites.push({ ...player, addedAt: Date.now() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  return true;
}

export function removeFavorite(profileId: number): void {
  const favorites = getFavorites().filter((f) => f.profileId !== profileId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function isFavorite(profileId: number): boolean {
  return getFavorites().some((f) => f.profileId === profileId);
}
