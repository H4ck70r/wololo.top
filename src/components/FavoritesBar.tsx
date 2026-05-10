import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFavorites, removeFavorite, type FavoritePlayer } from '../lib/favorites';
import { countryFlag } from '../lib/constants';

export default function FavoritesBar() {
  const [favorites, setFavorites] = useState<FavoritePlayer[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const handleRemove = (e: React.MouseEvent, profileId: number) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavorite(profileId);
    setFavorites(getFavorites());
  };

  if (favorites.length === 0) return null;

  return (
    <div className="w-full">
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Favorites</p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {favorites.map((player) => (
          <Link
            key={player.profileId}
            to={`/player/${player.profileId}`}
            className="flex items-center gap-2 px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg hover:border-gold-500/40 transition-colors shrink-0 group no-underline"
          >
            {player.country && (
              <span className="text-sm" title={player.country.toUpperCase()}>
                {countryFlag(player.country)}
              </span>
            )}
            <span className="text-sm text-gray-200 font-medium">{player.alias}</span>
            {player.rating != null && (
              <span className="text-xs text-gray-500">{player.rating}</span>
            )}
            <button
              onClick={(e) => handleRemove(e, player.profileId)}
              className="ml-1 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              title="Remove from favorites"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </Link>
        ))}
      </div>
    </div>
  );
}
