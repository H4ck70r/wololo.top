import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchPlayers } from '../lib/api';
import { countryFlag } from '../lib/constants';
import type { PlayerSearchResult } from '../lib/types';

interface SearchBarProps {
  large?: boolean;
  className?: string;
}

export default function SearchBar({ large = false, className = '' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  const { data, isFetching } = useQuery({
    queryKey: ['playerSearch', debouncedQuery],
    queryFn: () => searchPlayers(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const results: PlayerSearchResult[] = data?.players || [];

  // Deduplicate by profile_id (API returns same player from solo + team ladder)
  const uniqueResults = results.filter(
    (p, i, arr) => arr.findIndex((x) => x.profile_id === p.profile_id) === i
  );

  const goToPlayer = useCallback(
    (player: PlayerSearchResult) => {
      setQuery('');
      setIsOpen(false);
      navigate(`/player/${player.profile_id}`);
    },
    [navigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || uniqueResults.length === 0) {
      if (e.key === 'Enter' && query.length >= 2) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, uniqueResults.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && uniqueResults[selectedIndex]) {
          goToPlayer(uniqueResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    if (debouncedQuery.length >= 2 && uniqueResults.length > 0) {
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery, uniqueResults.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <svg
          className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 ${large ? 'w-6 h-6' : 'w-5 h-5'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (uniqueResults.length > 0 && query.length >= 2) setIsOpen(true);
          }}
          placeholder="Search player name, profile ID, or Steam ID..."
          className={`w-full bg-dark-600 border border-dark-400 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 transition-all ${
            large ? 'pl-14 pr-4 py-4 text-lg' : 'pl-12 pr-4 py-3 text-base'
          }`}
        />
        {isFetching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && uniqueResults.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-dark-700 border border-dark-400 rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto">
          {uniqueResults.slice(0, 15).map((player, index) => (
            <button
              key={`${player.profile_id}-${player.ladder_type}`}
              onClick={() => goToPlayer(player)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-none cursor-pointer ${
                index === selectedIndex
                  ? 'bg-dark-500 text-white'
                  : 'text-gray-300 hover:bg-dark-600'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate m-0">
                  {player.country && <span className="mr-1.5">{countryFlag(player.country)}</span>}
                  {player.alias}
                </p>
                <p className="text-xs text-gray-500 m-0">ID: {player.profile_id}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-gold-400 m-0">{player.rating}</p>
                <p className="text-xs text-gray-500 m-0">{player.ladder_type === 'solo' ? 'Solo RM' : 'Team RM'}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
