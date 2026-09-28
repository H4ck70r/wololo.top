import { useEffect, useMemo, useRef, useState } from 'react';
import { countryFlag, countryName, foldText } from '../lib/constants';
import { useT } from '../lib/i18n';

interface Props {
  value: string;
  countries: { country: string; player_count: number }[];
  onChange: (code: string) => void;
}

/**
 * Typing beats scrolling through 150-odd entries, and the old dropdown only
 * showed the ISO code -- you had to already know that MX is Mexico. This
 * matches on the country's name as well as its code, ignoring accents, so
 * "mexico" finds "México" and "mx" finds it too.
 */
export default function CountryFilter({ value, countries, onChange }: Props) {
  const { t, lang } = useT();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const options = useMemo(
    () =>
      countries.map((c) => ({
        ...c,
        name: countryName(c.country, lang) || c.country.toUpperCase(),
      })),
    [countries, lang]
  );

  const selected = options.find((o) => o.country === value) ?? null;

  const results = useMemo(() => {
    const q = foldText(query.trim());
    if (!q) return options;
    return options.filter(
      (o) => foldText(o.name).includes(q) || foldText(o.country).startsWith(q)
    );
  }, [options, query]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const choose = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery('');
    setCursor(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // With nothing highlighted, a single remaining match is the obvious pick.
      const pick = results[cursor] ?? (results.length === 1 ? results[0] : null);
      if (pick) choose(pick.country);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={open ? query : selected ? `${countryFlag(selected.country)} ${selected.name}` : ''}
        onChange={(e) => { setQuery(e.target.value); setCursor(-1); setOpen(true); }}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onKeyDown={onKeyDown}
        placeholder={t('lb.allCountries')}
        role="combobox"
        aria-expanded={open}
        aria-controls="country-options"
        className="w-full px-3 py-2 pr-8 rounded-lg bg-dark-600 border border-dark-400 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gold-500/50 transition-colors"
      />

      {value && !open && (
        <button
          type="button"
          onClick={() => choose('')}
          aria-label={t('lb.clearCountry')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-200 bg-transparent border-none cursor-pointer text-sm leading-none p-1"
        >
          ×
        </button>
      )}

      {open && (
        <div
          id="country-options"
          className="absolute z-50 w-full mt-1 bg-dark-700 border border-dark-400 rounded-lg shadow-2xl max-h-64 overflow-y-auto"
        >
          <button
            type="button"
            onClick={() => choose('')}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-dark-600 border-none bg-transparent cursor-pointer"
          >
            {t('lb.allCountries')}
          </button>
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500 m-0">{t('lb.noCountryMatch')}</p>
          ) : (
            results.map((o, i) => (
              <button
                key={o.country}
                type="button"
                onClick={() => choose(o.country)}
                onMouseEnter={() => setCursor(i)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm border-none cursor-pointer transition-colors ${
                  i === cursor ? 'bg-dark-500 text-white' : 'text-gray-300 bg-transparent hover:bg-dark-600'
                } ${o.country === value ? 'text-gold-400' : ''}`}
              >
                <span className="shrink-0">{countryFlag(o.country)}</span>
                <span className="truncate min-w-0">{o.name}</span>
                <span className="ml-auto shrink-0 text-xs text-gray-500 tabular-nums">
                  {o.player_count.toLocaleString()}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
