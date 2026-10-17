import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import SearchBar from '../components/SearchBar';
import FavoritesBar from '../components/FavoritesBar';
import { useT } from '../lib/i18n';
import { getLeaderboard, getLiveMatches, getCivMeta } from '../lib/api';
import { cleanMapName, formatDuration, getCivIcon, getCivName } from '../lib/constants';
import type { LeaderboardPlayer, LiveMatch } from '../lib/types';
import { avatarReal } from '../lib/avatar';
import MarcaEdad, { LeyendaEdades } from '../components/MarcaEdad';
import ReglaMapa from '../components/ReglaMapa';

/*
  La portada es el estado del frente, no una pagina de presentacion.

  Antes era la receta de cualquier landing: logo enorme con un brillo detras,
  tres cifras de marketing (una de ellas mal: decia 44 civs) y tres tarjetas
  con iconos explicando lo que hace la web. Quien llega aqui ya sabe lo que es
  un ladder; lo que no sabe es como esta hoy. Asi que la portada lo ensena:
  quien esta arriba, que se esta jugando ahora entre gente fuerte y que civs
  estan ganando esta semana. Y el buscador, que es a lo que se viene.
*/

// Por debajo de esto el porcentaje de victorias de una civ es ruido.
const MIN_PARTIDAS_META = 150;
// El listado en vivo de la portada es una muestra de lo fuerte, no el listado
// entero: primero las de 2000 o mas y, si a esa hora hay menos de tres, se
// completa con las de 1500 para que la franja no quede vacia de madrugada.
const ELO_DESTACADA = 2000;
const ELO_RESPALDO = 1500;

export default function Home() {
  const { t } = useT();

  return (
    <div>
      <Helmet>
        <title>wololo.top - Age of Empires II Player Stats & Analytics</title>
        <meta name="description" content="Search any AOE2 DE player by name, Steam ID, or profile ID. Track ratings, match history, civilization stats, rivals, and activity patterns." />
        <link rel="canonical" href="https://wololo.top" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] pt-10 sm:pt-16 pb-12 sm:pb-16">
          <div className="min-w-0 lg:pt-6">
            <h1
              className="font-display font-bold text-gray-50 m-0 leading-[0.95]"
              style={{ fontSize: 'clamp(3rem, 8.5vw, 6rem)', letterSpacing: '0.06em' }}
            >
              WOLOLO
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mt-5 mb-8 max-w-[36ch] leading-snug">
              {t('home.tagline')}
            </p>
            <SearchBar large className="max-w-2xl" />
            <div className="max-w-2xl mt-5">
              <FavoritesBar />
            </div>
          </div>

          <ElFrente />
        </section>

        <ReglaMapa />

        <section className="grid gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] py-10 sm:py-12">
          <EnDirecto />
          <MetaSemana />
        </section>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- El frente */

function ElFrente() {
  const { t } = useT();
  const { data, isLoading, error } = useQuery({
    queryKey: ['home', 'top5'],
    queryFn: () => getLeaderboard('rm', { limit: 5 }),
    staleTime: 5 * 60_000,
  });
  const jugadores = data?.data.players ?? [];
  //  La misma consulta que la franja de abajo (react-query la comparte): el
  //  pulso de "esto esta vivo" tiene que verse en el primer pantallazo.
  const { data: vivo } = useQuery({ queryKey: ['liveMatches'], queryFn: getLiveMatches, refetchInterval: 30_000, staleTime: 10_000 });
  const enCurso = (vivo?.matches ?? []).filter((m) => m.match_type?.endsWith('RM')).length;

  return (
    <section aria-labelledby="frente" className="placa self-start p-5 sm:p-6">
      <Cabecera id="frente" titulo={t('home.frontTitle')} etiqueta="1v1 RM" enlace={{ to: '/leaderboard', texto: t('home.fullLadder') }} />
      {error ? (
        <Fallo />
      ) : (
        <ol className="list-none m-0 p-0 mt-4">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <FilaVacia key={i} />)
            : jugadores.map((p) => <FilaJugador key={p.profile_id} p={p} />)}
        </ol>
      )}
      <LeyendaEdades className="mt-3 !text-[12px] gap-x-3" />
      {vivo && (
        <Link to="/live" className="mt-4 pt-3 border-t border-dark-400 flex items-center gap-2 text-sm text-gray-300 hover:text-gray-50 no-underline">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-live" />
          </span>
          {t('home.liveCount', { n: enCurso })}
          <span aria-hidden="true" className="ml-auto text-gray-500">→</span>
        </Link>
      )}
    </section>
  );
}

function FilaJugador({ p }: { p: LeaderboardPlayer }) {
  const primero = p.rank === 1;
  return (
    <li className="border-b border-dark-500 last:border-b-0">
      <Link
        to={`/player/${p.profile_id}`}
        className="group grid grid-cols-[2.25rem_2rem_minmax(0,1fr)_auto] items-center gap-3 py-2.5 no-underline"
      >
        <span className={`cifra text-xl text-right ${primero ? 'text-gold-400' : 'text-gray-500'}`}>
          {p.rank}
        </span>
        <Retrato src={avatarReal(p.avatar)} nombre={p.alias} destacado={primero} />
        <span className="min-w-0">
          <span className="block truncate font-semibold text-gray-100 group-hover:text-gold-400 transition-colors">
            {p.alias}
          </span>
          {p.country && (
            <span className="block font-mono text-xs text-gray-500 leading-tight">{p.country.toUpperCase()}</span>
          )}
        </span>
        <span className="flex items-center gap-2">
          <MarcaEdad rating={p.rating} />
          <span className={`cifra text-[1.6rem] ${primero ? 'text-gold-400' : 'text-gray-50'}`}>{p.rating}</span>
        </span>
      </Link>
    </li>
  );
}

function Retrato({ src, nombre, destacado }: { src: string | null; nombre: string; destacado?: boolean }) {
  const marco = destacado ? 'ring-1 ring-gold-400' : 'ring-1 ring-dark-300';
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={32}
        height={32}
        loading="lazy"
        className={`w-8 h-8 rounded-sm object-cover ${marco}`}
      />
    );
  }
  return (
    <span className={`w-8 h-8 rounded-sm bg-dark-500 grid place-items-center font-display text-sm text-gray-300 ${marco}`} aria-hidden="true">
      {nombre.slice(0, 1).toUpperCase()}
    </span>
  );
}

/* ---------------------------------------------------------------- En directo */

function EnDirecto() {
  const { t } = useT();
  const { data, isLoading, error } = useQuery({
    queryKey: ['liveMatches'],
    queryFn: getLiveMatches,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  // Solo clasificatorias de mapa aleatorio, ordenadas por el jugador mas fuerte.
  const rankeadas = (data?.matches ?? []).filter((m) => m.match_type?.endsWith('RM'));
  const ordenadas = rankeadas
    .map((m) => ({ m, tope: Math.max(0, ...m.players.map((p) => p.rating ?? 0)) }))
    .sort((a, b) => b.tope - a.tope);
  const altas = ordenadas.filter((x) => x.tope >= ELO_DESTACADA);
  const fuertes = (altas.length >= 3 ? altas : ordenadas.filter((x) => x.tope >= ELO_RESPALDO))
    .slice(0, 6)
    .map((x) => x.m);

  return (
    <section aria-labelledby="directo" className="min-w-0">
      <Cabecera
        id="directo"
        titulo={t('home.liveTitle')}
        enlace={{ to: '/live', texto: t('home.liveAll') }}
      />
      {error ? (
        <Fallo />
      ) : isLoading ? (
        <div className="mt-4">{Array.from({ length: 4 }).map((_, i) => <FilaVacia key={i} />)}</div>
      ) : fuertes.length === 0 ? (
        <p className="text-gray-400 mt-4">{t('home.liveNone')}</p>
      ) : (
        <ul className="list-none m-0 p-0 mt-4">
          {fuertes.map((m) => (
            <FilaDirecto key={m.lobby_id} m={m} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FilaDirecto({ m }: { m: LiveMatch }) {
  const mapa = m.map || cleanMapName(m.map_name);
  const mitad = Math.ceil(m.players.length / 2);
  const lados = [m.players.slice(0, mitad), m.players.slice(mitad)];
  const duracion = m.duration_seconds && m.duration_seconds > 0 ? formatDuration(m.duration_seconds) : null;

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:grid-cols-[7.5rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 py-3 border-b border-dark-500 last:border-b-0">
      <span className="col-span-3 sm:col-span-1 font-mono text-xs text-gray-500 leading-tight">
        <span className="text-gray-300 uppercase">{m.match_type}</span>
        <span className="block">{mapa}{duracion ? ` · ${duracion}` : ''}</span>
      </span>
      <Bando jugadores={lados[0]} alinear="right" />
      <span className="font-display text-xs font-semibold text-gray-600 px-1" aria-label="vs">VS</span>
      <Bando jugadores={lados[1]} alinear="left" />
    </li>
  );
}

function Bando({ jugadores, alinear }: { jugadores: LiveMatch['players']; alinear: 'left' | 'right' }) {
  const [lider, ...resto] = [...jugadores].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  if (!lider) return <span />;
  const derecha = alinear === 'right';
  return (
    <span className={`min-w-0 flex items-baseline gap-2 ${derecha ? 'justify-end text-right' : ''}`}>
      {derecha && lider.rating != null && (
        <span className="inline-flex items-center gap-1.5 cifra text-lg text-gray-200 order-2"><MarcaEdad rating={lider.rating} />{lider.rating}</span>
      )}
      <Link
        to={`/player/${lider.profile_id}`}
        className={`min-w-0 truncate font-semibold text-gray-100 hover:text-gold-400 no-underline ${derecha ? 'order-1' : ''}`}
      >
        {lider.alias || `#${lider.profile_id}`}
        {resto.length > 0 && (
          <span className="font-normal text-gray-500" title={resto.map((r) => r.alias).join(', ')}>
            {' '}+{resto.length}
          </span>
        )}
      </Link>
      {!derecha && lider.rating != null && (
        <span className="inline-flex items-center gap-1.5 cifra text-lg text-gray-200"><MarcaEdad rating={lider.rating} />{lider.rating}</span>
      )}
    </span>
  );
}

/* ---------------------------------------------------------------- Meta */

function MetaSemana() {
  const { t } = useT();
  const { data, isLoading, error } = useQuery({
    queryKey: ['home', 'meta7'],
    queryFn: () => getCivMeta({ match_type: '6', min_rating: 1800, max_rating: 4000, days: 7 }),
    staleTime: 30 * 60_000,
  });

  const civs = (data?.civilizations ?? [])
    .map((c) => ({ ...c, wr: Number(c.win_rate) }))
    .filter((c) => c.games >= MIN_PARTIDAS_META)
    .sort((a, b) => b.wr - a.wr)
    .slice(0, 3);

  return (
    <section aria-labelledby="meta" className="min-w-0">
      <Cabecera id="meta" titulo={t('home.metaTitle')} enlace={{ to: '/stats', texto: t('home.metaAll') }} />
      {error ? (
        <Fallo />
      ) : (
        <ol className="list-none m-0 p-0 mt-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <FilaVacia key={i} />)
            : civs.map((c, i) => {
                const icono = getCivIcon(c.civ_id);
                return (
                  <li key={c.civ_id} className="flex items-center gap-4 py-3 border-b border-dark-500 last:border-b-0">
                    <span className="cifra text-xl text-gray-600 w-4 text-right">{i + 1}</span>
                    {icono ? (
                      <img src={icono} alt="" width={40} height={40} className="w-10 h-10 object-contain" loading="lazy" />
                    ) : (
                      <span className="w-10 h-10" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-gray-100 truncate">{getCivName(c.civ_id)}</span>
                      <span className="block font-mono text-xs text-gray-500">{t('home.games', { n: c.games })}</span>
                    </span>
                    <span className="cifra text-[1.6rem] text-win">
                      {c.wr.toFixed(1)}
                      <span className="text-base text-gray-500">%</span>
                    </span>
                  </li>
                );
              })}
        </ol>
      )}
      <p className="font-mono text-xs text-gray-500 mt-3 mb-0">{t('home.metaNote', { n: MIN_PARTIDAS_META })}</p>
    </section>
  );
}

/* ---------------------------------------------------------------- Piezas */

function Cabecera({
  id,
  titulo,
  enlace,
  extra,
  etiqueta,
}: {
  id: string;
  titulo: string;
  enlace: { to: string; texto: string };
  extra?: React.ReactNode;
  etiqueta?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={id} className="titulo text-[15px] sm:text-base m-0">
          {titulo}
          {/* Cinzel no tiene cifras propias: "1v1" se lee "IVI". Las cifras van en mono. */}
          {etiqueta && <span className="ml-2 align-[0.15em] font-mono text-xs font-medium tracking-normal normal-case text-gray-400">{etiqueta}</span>}
        </h2>
        <Link to={enlace.to} className="shrink-0 text-sm font-medium text-gray-300 hover:text-gray-50 underline decoration-dark-300 hover:decoration-gold-400">
          {enlace.texto} <span aria-hidden="true">→</span>
        </Link>
      </div>
      {extra && <div className="mt-1.5">{extra}</div>}
    </div>
  );
}

function FilaVacia() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-dark-500 last:border-b-0" aria-hidden="true">
      <span className="w-8 h-8 bg-dark-500 animate-pulse rounded-sm" />
      <span className="h-3.5 flex-1 max-w-48 bg-dark-500 animate-pulse rounded-sm" />
      <span className="ml-auto h-5 w-12 bg-dark-500 animate-pulse rounded-sm" />
    </div>
  );
}

function Fallo() {
  const { t } = useT();
  return <p className="text-gray-400 mt-4 mb-0">{t('home.failed')}</p>;
}
