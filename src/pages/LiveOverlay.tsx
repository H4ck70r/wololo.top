import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useT } from '../lib/i18n';
import { COLORES_JUGADOR } from '../lib/jugadores';
import CIVS from '../lib/civs-replay.json';

//  Mismo criterio que el resto del sitio: el replay guarda el CLIC y lo que
//  la gente compara es cuando la edad CAE, asi que se le suma la investigacion,
//  que es fija. La diferencia contra la franja se calcula sobre el clic, que es
//  lo que promedia la base, y asi el delta no se mueve.
const INVESTIGACION_MS = { feudal: 130_000, castle: 160_000, imperial: 190_000 };

//  Cada cuanto se repregunta. El vigilante reparsea el replay cada ~20s, asi
//  que bajar de esto solo gastaria peticiones sin enseñar nada nuevo.
const REFRESCO_MS = 5_000;

type Cifras = {
  profile_id: number;
  name: string | null;
  civ: number | null;
  rating: number | null;
  bracket: string | null;
  opening: string | null;
  feudal_ms: number | null;
  castle_ms: number | null;
  imperial_ms: number | null;
  villagers_15m: number | null;
  tc_idle_ms: number | null;
  apm: number | null;
  first_stable_ms: number | null;
  units: Record<string, number> | null;
};

type Jugador = {
  name: string | null;
  civ: number | null;
  color: number | null;
  team: number | null;
  profile_id: number | null;
  is_ai: boolean;
  avatar?: string | null;
};

type Referencia = {
  scope: 'opening' | 'bracket';
  opening: string | null;
  samples: number | null;
  feudal_s: number | null;
  castle_s: number | null;
  imperial_s: number | null;
  villagers_15m: number | null;
  apm: number | null;
} | null;

type Respuesta = {
  status: string;
  live: boolean;
  age_ms: number;
  data: {
    map_size: string | null;
    flock_count: number | null;
      players: Jugador[];
    me: Cifras;
    others: Cifras[];
    reference: Referencia;
    at: string;
  };
};

function reloj(ms: number | null | undefined) {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** La diferencia contra la franja, con el signo puesto para que + sea mejor. */
function Delta({
  valor,
  referencia,
  menorEsMejor = true,
  sufijo = '',
  decimales = 0,
}: {
  valor: number | null | undefined;
  referencia: number | null | undefined;
  menorEsMejor?: boolean;
  sufijo?: string;
  decimales?: number;
}) {
  if (valor == null || referencia == null) return null;
  const dif = menorEsMejor ? referencia - valor : valor - referencia;
  //  Los segundos van enteros: "+98.8s" finge una precision que no hay, porque
  //  el promedio detras ya esta redondeado al segundo.
  const f = 10 ** decimales;
  const r = Math.round(dif * f) / f;
  if (r === 0) return <span className="text-stone-400 tabular-nums">=</span>;
  return (
    <span className={`tabular-nums ${r > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
      {r > 0 ? '+' : ''}
      {r}
      {sufijo}
    </span>
  );
}

/** El color que el juego le dio a ese jugador. */
function colorDe(j: Jugador) {
  const i = j.color ?? 0;
  return COLORES_JUGADOR[((i % COLORES_JUGADOR.length) + COLORES_JUGADOR.length) %
    COLORES_JUGADOR.length];
}

const civDe = (id: number | null) =>
  (id != null && (CIVS as Record<string, string>)[String(id)]) || null;

/**
 * Un jugador: avatar, nombre en su color del juego y civilizacion.
 *
 * Se pintan los dos lados porque eso ya se ve en el lobby antes de empezar.
 * Las cifras, en cambio, son solo del que publica: lo que el rival esta
 * haciendo mientras se juega no se enseña.
 */
function Jugador({ j, destacado, verCiv = true }: {
  j: Jugador; destacado: boolean; verCiv?: boolean;
}) {
  const color = colorDe(j);
  const civ = verCiv ? civDe(j.civ) : null;
  return (
    <div className={`flex items-center gap-2 ${destacado ? '' : 'opacity-70'}`}>
      {j.avatar ? (
        <img
          src={j.avatar}
          alt=""
          className="h-7 w-7 flex-none rounded"
          style={{ outline: `2px solid ${color}`, outlineOffset: '-1px' }}
          onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
        />
      ) : (
        <span
          className="flex h-7 w-7 flex-none items-center justify-center rounded text-xs font-semibold text-stone-950"
          style={{ background: color }}
        >
          {(j.name || '?').charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium" style={{ color }}>
          {j.name || '—'}
        </span>
        {civ && <span className="block truncate text-xs text-stone-500">{civ}</span>}
      </span>
    </div>
  );
}

function Fila({
  etiqueta,
  valor,
  children,
}: {
  etiqueta: string;
  valor: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-stone-400 text-sm">{etiqueta}</span>
      <span className="flex items-baseline gap-2">
        <span className="font-mono tabular-nums text-stone-100">{valor}</span>
        <span className="text-xs w-14 text-right">{children}</span>
      </span>
    </div>
  );
}

/**
 * El otro lado, en corto.
 *
 * Va sin comparacion contra la franja: su rating y su apertura se comparan
 * con SU franja, no con la de quien publica, y mezclarlas daria un numero
 * que no significa nada.
 */
function Rival({ c, j }: { c: Cifras; j?: Jugador }) {
  const { t } = useT();
  const u = Object.entries(c.units || {}).filter(([, v]) => v > 0);
  return (
    <div className="border-t border-stone-800 px-3 py-2">
      {j && <Jugador j={j} destacado={false} />}
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-stone-400">
        <span className="text-gold-500/80">{c.opening || '—'}</span>
        <span>
          {t('ov.feudal')}{' '}
          <span className="font-mono text-stone-200">
            {c.feudal_ms == null ? '—' : reloj(c.feudal_ms + INVESTIGACION_MS.feudal)}
          </span>
        </span>
        <span>
          {t('ov.castle')}{' '}
          <span className="font-mono text-stone-200">
            {c.castle_ms == null ? '—' : reloj(c.castle_ms + INVESTIGACION_MS.castle)}
          </span>
        </span>
        {c.imperial_ms != null && (
          <span>
            {t('ov.imperial')}{' '}
            <span className="font-mono text-stone-200">
              {reloj(c.imperial_ms + INVESTIGACION_MS.imperial)}
            </span>
          </span>
        )}
        <span>
          {t('ov.apm')} <span className="font-mono text-stone-200">{c.apm ?? '—'}</span>
        </span>
      </div>
      {u.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {u.map(([k, n]) => (
            <span key={k} className="rounded bg-stone-800/70 px-1.5 py-0.5 text-xs text-stone-400">
              {t(`ov.u.${k}` as never)} <span className="font-mono text-stone-200">{n}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LiveOverlay() {
  const { t } = useT();
  const { profileId } = useParams();
  const [params] = useSearchParams();
  const token = params.get('t') || '';
  //  ?bg=none para montarlo encima del juego en OBS, donde el fondo lo pone
  //  la captura y un panel opaco taparia la partida.
  const transparente = params.get('bg') === 'none';

  /*
    Que se enseña, por parametros del enlace.

    Va asi y no en una pantalla de ajustes porque el que lo monta esta en OBS
    pegando una URL: una casilla que marcar en otra pagina es un paso mas y
    otro sitio donde se queda la configuracion de la semana pasada.

      ?hide=civ,elo,apm,units,reference,opponent
      ?title=NACHO%20vs%20RIVALES
      ?score=5-2

    Sin parametros se enseña todo, que es lo que ya habia.

    En ingles como las banderas del vigilante, por lo mismo: esto lo monta
    gente que no habla castellano. Los nombres viejos en español se siguen
    leyendo, que ya hay enlaces por ahi con ellos.
  */
  const ocultar = new Set(
    (params.get('hide') || params.get('ocultar') || '').split(',').map((x) => x.trim())
  );
  //  Los nombres de pieza tambien cambiaron; se acepta el viejo al lado.
  const EQUIV: Record<string, string> = {
    unidades: 'units', referencia: 'reference', rival: 'opponent',
  };
  for (const v of [...ocultar]) if (EQUIV[v]) ocultar.add(EQUIV[v]);
  const ver = (k: string) => !ocultar.has(k);
  const titulo = params.get('title') || params.get('titulo');
  const marcador = params.get('score') || params.get('marcador');

  //  Con ?bg=none no basta con no pintar fondo aqui: el body de la app lleva
  //  el suyo y en un browser source de OBS taparia la escena entera. Se apaga
  //  mientras esta la pagina y se devuelve al salir, que la vuelta al sitio
  //  normal es una navegacion de React, no una recarga.
  useEffect(() => {
    if (!transparente) return;
    const html = document.documentElement;
    const body = document.body;
    const antes = [html.style.background, body.style.background] as const;
    html.style.background = 'transparent';
    body.style.background = 'transparent';
    return () => {
      html.style.background = antes[0];
      body.style.background = antes[1];
    };
  }, [transparente]);

  const [res, setRes] = useState<Respuesta | null>(null);
  const [fallo, setFallo] = useState<string | null>(null);
  //  En una ref y no en el estado: el intervalo se crea una vez y leer `res`
  //  desde dentro daria siempre el valor de la primera vuelta.
  const tuvoDatos = useRef(false);

  useEffect(() => {
    if (!profileId || !token) {
      setFallo(t('ov.noToken'));
      return;
    }
    let vivo = true;
    const base = import.meta.env.VITE_API_BASE_URL || '';
    const pedir = async () => {
      try {
        const r = await fetch(`${base}/api/overlay/${profileId}?t=${encodeURIComponent(token)}`);
        if (!r.ok) throw new Error(String(r.status));
        const d = (await r.json()) as Respuesta;
        if (vivo) {
          tuvoDatos.current = true;
          setRes(d);
          setFallo(null);
        }
      } catch {
        //  No se borra lo que ya habia: un fallo de red a mitad de partida no
        //  es motivo para dejar el panel en blanco.
        if (vivo && !tuvoDatos.current) setFallo(t('ov.notFound'));
      }
    };
    pedir();
    const id = setInterval(pedir, REFRESCO_MS);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, [profileId, token, t]);

  const fondo = transparente ? '' : 'bg-stone-950';

  if (fallo && !res) {
    return (
      <div className={`${fondo} min-h-screen flex items-center justify-center p-6`}>
        <p className="text-stone-400 text-sm">{fallo}</p>
      </div>
    );
  }
  if (!res) {
    return (
      <div className={`${fondo} min-h-screen flex items-center justify-center p-6`}>
        <p className="text-stone-500 text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  const { me, reference: ref, players, map_size, flock_count } = res.data;
  const others = res.data.others || [];
  const yo = players.find((p) => p.profile_id === me.profile_id);
  //  Los que no tienen cifras -las IA, que no entran en las medias- se quedan
  //  arriba como nombre y civ, que es lo que el lobby ya enseñaba.
  const conCifras = new Set(others.map((o) => o.profile_id));
  const soloNombre = players.filter(
    (p) => p !== yo && !(p.profile_id && conCifras.has(p.profile_id))
  );
  const unidades = Object.entries(me.units || {}).filter(([, v]) => v > 0);

  return (
    <div className={`${fondo} min-h-screen p-3`}>
      <div className="w-72 overflow-hidden rounded-xl border border-stone-800 bg-stone-900/90 backdrop-blur">
        {/* Quien juega: los dos lados, con su color del juego y su civ. */}
        {/* El titulo y el marcador los pone el que monta el enlace: son su
            sesion, no algo que el replay sepa. */}
        {(titulo || marcador) && (
          <div className="flex items-center justify-between gap-2 border-b border-stone-800 bg-stone-950/60 px-3 py-2">
            {titulo && (
              <span className="truncate text-sm font-semibold text-stone-100">{titulo}</span>
            )}
            {marcador && (
              <span className="font-mono text-sm text-gold-400">{marcador}</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-2 px-3 pt-3">
          <span className="flex items-center gap-1.5 text-xs text-stone-500">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                res.live ? 'animate-pulse bg-emerald-400' : 'bg-stone-600'
              }`}
            />
            {res.live ? t('ov.liveNow') : t('ov.ended')}
          </span>
          {ver('elo') && me.rating != null && (
            <span className="font-mono text-xs text-stone-400">
              {me.rating}
              {me.bracket && <span className="ml-1 text-stone-600">{me.bracket}</span>}
            </span>
          )}
        </div>

        <div className="space-y-2 px-3 py-2">
          {yo && <Jugador j={yo} destacado verCiv={ver('civ')} />}
          {soloNombre.map((j, i) => (
            <Jugador key={i} j={j} destacado={false} verCiv={ver('civ')} />
          ))}
        </div>

        {/*
          La apertura y contra que se compara, juntas: sin saber de que esta
          hecha la referencia los numeros de abajo no dicen nada.
        */}
        <div className="border-t border-stone-800 bg-stone-950/40 px-3 py-2">
          <p className="text-sm font-medium text-gold-400">{me.opening || '—'}</p>
          {ref && ver('reference') && (
            <p className="text-xs text-stone-500">
              {ref.scope === 'opening'
                ? t('ov.refOpening', { n: String(ref.samples ?? '?'), b: me.bracket || '' })
                : t('ov.refBracket', { b: me.bracket || '' })}
            </p>
          )}
        </div>

        <div className="px-3 py-1.5">
          <Fila
            etiqueta={t('ov.feudal')}
            valor={me.feudal_ms == null ? '—' : reloj(me.feudal_ms + INVESTIGACION_MS.feudal)}
          >
            <Delta
              valor={me.feudal_ms == null ? null : me.feudal_ms / 1000}
              referencia={ref?.feudal_s}
              sufijo="s"
            />
          </Fila>
          <Fila
            etiqueta={t('ov.castle')}
            valor={me.castle_ms == null ? '—' : reloj(me.castle_ms + INVESTIGACION_MS.castle)}
          >
            <Delta
              valor={me.castle_ms == null ? null : me.castle_ms / 1000}
              referencia={ref?.castle_s}
              sufijo="s"
            />
          </Fila>
          <Fila
            etiqueta={t('ov.imperial')}
            valor={me.imperial_ms == null ? '—' : reloj(me.imperial_ms + INVESTIGACION_MS.imperial)}
          >
            <Delta
              valor={me.imperial_ms == null ? null : me.imperial_ms / 1000}
              referencia={ref?.imperial_s}
              sufijo="s"
            />
          </Fila>
          <Fila
            etiqueta={t('ov.vills')}
            valor={me.villagers_15m == null ? '—' : String(me.villagers_15m)}
          >
            <Delta valor={me.villagers_15m} referencia={ref?.villagers_15m} menorEsMejor={false} />
          </Fila>
          <Fila etiqueta={t('ov.tcIdle')} valor={reloj(me.tc_idle_ms)} />
          {ver('apm') && (
            <Fila etiqueta={t('ov.apm')} valor={me.apm == null ? '—' : String(me.apm)}>
              <Delta valor={me.apm} referencia={ref?.apm} menorEsMejor={false} decimales={1} />
            </Fila>
          )}
        </div>

        {/*
          Producido, no vivo. El replay guarda ordenes, no estado: no sabe de
          bajas, asi que restarlas es imposible y decir "vivos" seria mentir.
        */}
        {ver('units') && unidades.length > 0 && (
          <div className="border-t border-stone-800 px-3 py-2">
            <p className="mb-1 text-[10px] uppercase tracking-wide text-stone-600">
              {t('ov.trained')}
            </p>
            <div className="flex flex-wrap gap-1">
              {unidades.map(([clave, n]) => (
                <span
                  key={clave}
                  className="rounded bg-stone-800 px-1.5 py-0.5 text-xs text-stone-300"
                >
                  {t(`ov.u.${clave}` as never)}{' '}
                  <span className="font-mono text-stone-100">{n}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {ver('opponent') && others.map((c, i) => (
          <Rival key={i} c={c} j={players.find((p) => p.profile_id === c.profile_id)} />
        ))}

        <div className="flex flex-wrap items-center gap-x-2 border-t border-stone-800 px-3 py-2 text-xs text-stone-600">
          {map_size && <span>{map_size}</span>}
          {flock_count != null && <span>· {t('ov.flock', { n: String(flock_count) })}</span>}
        </div>
      </div>
    </div>
  );
}
