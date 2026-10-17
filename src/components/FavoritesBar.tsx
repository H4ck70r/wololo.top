import { useT } from '../lib/i18n';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFavorites, removeFavorite, type FavoritePlayer } from '../lib/favorites';
import Bandera from './Bandera';

export default function FavoritesBar() {
  const { t } = useT();
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
      <p className="font-display text-xs font-semibold tracking-[0.14em] uppercase text-gray-500 mb-2">{t('favorites.title')}</p>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {favorites.map((player) => (
          <Link
            key={player.profileId}
            to={`/player/${player.profileId}`}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-dark-700 border border-dark-400 rounded-sm hover:border-gold-500/50 transition-colors shrink-0 group no-underline"
          >
            <Bandera code={player.country} />
            <span className="text-sm text-gray-100 font-semibold">{player.alias}</span>
            {player.rating != null && (
              <span className="cifra text-[15px] text-gray-300">{player.rating}</span>
            )}
            <button
              onClick={(e) => handleRemove(e, player.profileId)}
              className="ml-0.5 p-0.5 text-gray-600 hover:text-red-400 transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
              aria-label={t('favorites.remove')}
              title={t('favorites.remove')}
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
