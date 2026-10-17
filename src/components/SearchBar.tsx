import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchPlayers } from '../lib/api';
import { useT } from '../lib/i18n';
import type { PlayerSearchResult } from '../lib/types';
import Bandera from './Bandera';

interface SearchBarProps {
  large?: boolean;
  className?: string;
}

export default function SearchBar({ large = false, className = '' }: SearchBarProps) {
  const { t } = useT();
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

  //  "/" lleva al buscador desde cualquier sitio, como en cualquier herramienta
  //  que se usa a diario. Solo cuando no se esta escribiendo ya en otro campo.
  useEffect(() => {
    if (!large) return;
    function atajo(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const escribiendo = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (e.key === '/' && !escribiendo && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', atajo);
    return () => document.removeEventListener('keydown', atajo);
  }, [large]);

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
          className={`absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none ${large ? 'w-5 h-5' : 'w-4.5 h-4.5'}`}
          aria-hidden="true"
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
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          className={`w-full bg-dark-700 border border-dark-400 border-b-gray-700 rounded-sm text-gray-50 placeholder-gray-600 focus:outline-none focus:border-dark-300 focus:border-b-gold-400 focus:bg-dark-600 transition-colors ${
            large ? 'pl-12 pr-14 py-4 text-lg' : 'pl-11 pr-4 py-3 text-base'
          }`}
        />
        {isFetching ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2" role="status" aria-label={t('common.loading')}>
            <div className="w-4 h-4 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : large && !query ? (
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:block px-1.5 py-0.5 font-mono text-xs text-gray-500 border border-dark-300 rounded-sm">
            /
          </kbd>
        ) : null}
      </div>

      {isOpen && uniqueResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-dark-800 border border-dark-400 border-t-gold-400/60 rounded-sm shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] overflow-hidden max-h-96 overflow-y-auto">
          {uniqueResults.slice(0, 15).map((player, index) => (
            <button
              key={`${player.profile_id}-${player.ladder_type}`}
              onClick={() => goToPlayer(player)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors border-0 border-b border-dark-500 last:border-b-0 cursor-pointer ${
                index === selectedIndex
                  ? 'bg-dark-600 text-gray-50'
                  : 'bg-transparent text-gray-200 hover:bg-dark-700'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate m-0 flex items-center gap-2">
                  <Bandera code={player.country} />
                  <span className="truncate">{player.alias}</span>
                </p>
                <p className="font-mono text-xs text-gray-500 m-0">#{player.profile_id}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="cifra text-lg text-gray-50 m-0">{player.rating}</p>
                <p className="font-mono text-xs uppercase text-gray-500 m-0">{player.ladder_type === 'solo' ? '1v1 RM' : 'Team RM'}</p>
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
