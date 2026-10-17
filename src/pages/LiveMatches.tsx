import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useT } from '../lib/i18n';
import { getLiveMatches } from '../lib/api';
import { cleanMapName, formatDuration } from '../lib/constants';
import type { LiveMatch } from '../lib/types';
import MarcaEdad, { LeyendaEdades } from '../components/MarcaEdad';

/*
  Lo que se esta jugando ahora, ordenado por quien lo juega.

  Eran sesenta tarjetas iguales, cada una con su propia insignia "LIVE" -la
  pagina entera es en directo, decirlo sesenta veces no informa- y en el orden
  en que llegaban. Quien entra aqui busca la partida buena: arriba las de gente
  de 2000 o mas, en grande; debajo el resto en filas compactas, de la mas
  fuerte a la mas floja, con filtros por modo y por nivel.
*/

const DESTACADA = 2000;

type Modo = 'todas' | 'rm1' | 'rmEquipos' | 'otras';
const NIVELES = [0, 1500, 2000] as const;

function tope(m: LiveMatch) {
  return Math.max(0, ...m.players.map((p) => p.rating ?? 0));
}

function modoDe(m: LiveMatch): Exclude<Modo, 'todas'> {
  if (m.match_type === '1v1 RM') return 'rm1';
  if (m.match_type && /^[234]v[234] RM$/.test(m.match_type)) return 'rmEquipos';
  return 'otras';
}

export default function LiveMatches() {
  const { t } = useT();
  const [modo, setModo] = useState<Modo>('todas');
  const [nivel, setNivel] = useState<(typeof NIVELES)[number]>(0);
  const { data, isLoading, error } = useQuery({
    queryKey: ['liveMatches'],
    queryFn: getLiveMatches,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const total = data?.total ?? 0;
  const todas = [...(data?.matches ?? [])].sort((a, b) => tope(b) - tope(a));
  const filtradas = todas.filter((m) => (modo === 'todas' || modoDe(m) === modo) && tope(m) >= nivel);
  const destacadas = filtradas.filter((m) => tope(m) >= DESTACADA);
  const resto = filtradas.filter((m) => tope(m) < DESTACADA);

  const modos: { id: Modo; texto: string }[] = [
    { id: 'todas', texto: t('live.mode.all') },
    { id: 'rm1', texto: '1v1 RM' },
    { id: 'rmEquipos', texto: 'Team RM' },
    { id: 'otras', texto: t('live.mode.other') },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Helmet>
        <title>Live Matches - wololo.top</title>
        <meta name="description" content={`${total} Age of Empires II matches happening right now. Watch live games and see who's playing.`} />
        <link rel="canonical" href="https://wololo.top/live" />
      </Helmet>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="titulo text-2xl sm:text-3xl m-0 flex items-center gap-3">
            {t('live.title')}
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-live" />
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-2 mb-0" aria-live="polite">
            {isLoading ? t('common.loading') : t('live.inProgress', { n: total })}
            <span className="text-gray-500"> · {t('live.autoRefresh')}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="seg" role="group" aria-label={t('live.mode.label')}>
            {modos.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={modo === m.id}
                onClick={() => setModo(m.id)}
                className={modo === m.id ? 'sel-activo' : ''}
              >
                {m.texto}
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label={t('live.level.label')}>
            {NIVELES.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={nivel === n}
                onClick={() => setNivel(n)}
                className={`font-score ${nivel === n ? 'sel-activo' : ''}`}
              >
                {n === 0 ? t('live.level.any') : `${n}+`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <LeyendaEdades className="mb-5" />

      {error && <p className="text-loss border border-loss/30 bg-loss/5 rounded-sm px-4 py-3">{t('live.failed')}</p>}

      {isLoading && (
        <div aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 border-b border-dark-500 flex items-center gap-4">
              <span className="w-20 h-3 bg-dark-500 animate-pulse" />
              <span className="flex-1 h-4 bg-dark-500 animate-pulse max-w-72" />
              <span className="w-10 h-5 bg-dark-500 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && filtradas.length === 0 && (
        <p className="text-gray-400 border-y border-dark-400 py-10 text-center">
          {todas.length === 0 ? t('live.none') : t('live.noneFiltered')}
        </p>
      )}

      {destacadas.length > 0 && (
        <section aria-labelledby="destacadas" className="mb-8">
          <h2 id="destacadas" className="titulo text-[14px] m-0 mb-3">
            {t('live.featured', { n: DESTACADA })}
          </h2>
          <ul className="list-none m-0 p-0 grid gap-3 md:grid-cols-2">
            {destacadas.map((m) => (
              <li key={m.lobby_id} className="placa">
                <Fila m={m} grande />
              </li>
            ))}
          </ul>
        </section>
      )}

      {resto.length > 0 && (
        <section aria-label={t('live.title')}>
          <ul className="list-none m-0 p-0 border-t border-dark-400">
            {resto.map((m) => (
              <li key={m.lobby_id} className="border-b border-dark-500 hover:bg-dark-700/60 transition-colors">
                <Fila m={m} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Fila({ m, grande = false }: { m: LiveMatch; grande?: boolean }) {
  const { t } = useT();
  const mapa = m.map || cleanMapName(m.map_name);
  const duracion = m.duration_seconds && m.duration_seconds > 0 ? formatDuration(m.duration_seconds) : null;
  const mitad = Math.ceil(m.players.length / 2);
  const conocido = m.match_type && !m.match_type.startsWith('Type ');

  return (
    <div className={`grid items-center gap-x-4 gap-y-2 ${grande ? 'p-4 sm:p-5 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]' : 'py-3 px-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:grid-cols-[13rem_minmax(0,1fr)_auto_minmax(0,1fr)]'}`}>
      <div className={`font-mono text-xs text-gray-500 leading-tight ${grande ? 'col-span-3 flex flex-wrap gap-x-2' : 'col-span-3 md:col-span-1 flex flex-wrap gap-x-2 md:block'}`}>
        <span className="text-gray-300 uppercase" title={conocido ? undefined : `${m.match_type} (${m.match_type_id})`}>
          {m.match_type === 'Unranked' ? t('live.unranked') : conocido ? m.match_type : t('live.mode.other')}
        </span>
        <span className={grande ? '' : 'md:block'}>
          {mapa}
          {duracion ? ` · ${duracion}` : ''}
        </span>
      </div>
      <Lado jugadores={m.players.slice(0, mitad)} derecha grande={grande} />
      <span className={`font-display font-semibold text-gray-600 ${grande ? 'text-base' : 'text-xs'}`} aria-label="vs">VS</span>
      <Lado jugadores={m.players.slice(mitad)} grande={grande} />
    </div>
  );
}

function Lado({ jugadores, derecha = false, grande }: { jugadores: LiveMatch['players']; derecha?: boolean; grande: boolean }) {
  return (
    <ul className={`list-none m-0 p-0 min-w-0 space-y-0.5 ${derecha ? 'text-right' : ''}`}>
      {jugadores.map((p) => (
        <li key={p.profile_id} className={`flex items-baseline gap-2 min-w-0 ${derecha ? 'justify-end' : ''}`}>
          {derecha && p.rating != null && <Elo r={p.rating} grande={grande} />}
          <Link
            to={`/player/${p.profile_id}`}
            className={`min-w-0 truncate no-underline hover:text-gold-400 transition-colors ${grande ? 'font-score text-xl font-bold text-gray-50' : 'text-[15px] font-medium text-gray-100'}`}
          >
            {p.alias || `#${p.profile_id}`}
          </Link>
          {!derecha && p.rating != null && <Elo r={p.rating} grande={grande} />}
        </li>
      ))}
    </ul>
  );
}

function Elo({ r, grande }: { r: number; grande: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 shrink-0 cifra text-gray-200 ${grande ? 'text-xl' : 'text-base'}`}>
      <MarcaEdad rating={r} />
      {r}
    </span>
  );
}
