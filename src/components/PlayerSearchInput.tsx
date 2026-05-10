import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchPlayers } from '../lib/api';
import { countryFlag } from '../lib/constants';
import type { PlayerSearchResult } from '../lib/types';

interface Props {
  onSelect: (player: PlayerSearchResult) => void;
  placeholder?: string;
  className?: string;
  excludeProfileId?: number;
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function PlayerSearchInput({ onSelect, placeholder, className = '', excludeProfileId }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  const { data, isFetching } = useQuery({
    queryKey: ['playerSearch', debouncedQuery],
    queryFn: () => searchPlayers(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  const results = (data?.players || []).filter(
    (p, i, arr) => arr.findIndex((x) => x.profile_id === p.profile_id) === i
  ).filter(p => p.profile_id !== excludeProfileId);

  const handleSelect = useCallback(
    (player: PlayerSearchResult) => {
      setQuery('');
      setIsOpen(false);
      onSelect(player);
    },
    [onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) handleSelect(results[selectedIndex]);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  useEffect(() => {
    if (debouncedQuery.length >= 2 && results.length > 0) {
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery, results.length]);

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
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0 && query.length >= 2) setIsOpen(true); }}
          placeholder={placeholder || 'Search player...'}
          className="w-full bg-dark-600 border border-dark-400 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 transition-all pl-10 pr-4 py-2.5 text-sm"
        />
        {isFetching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-dark-700 border border-dark-400 rounded-lg shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          {results.slice(0, 10).map((player, index) => (
            <button
              key={player.profile_id}
              onClick={() => handleSelect(player)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors border-none cursor-pointer ${
                index === selectedIndex ? 'bg-dark-500 text-white' : 'text-gray-300 hover:bg-dark-600'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate m-0 text-sm">
                  {player.country && <span className="mr-1">{countryFlag(player.country)}</span>}
                  {player.alias}
                </p>
              </div>
              <span className="text-xs font-medium text-gold-400 shrink-0">{player.rating}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
