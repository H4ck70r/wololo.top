import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useT } from '../lib/i18n';

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
};

type Referencia = {
  scope: 'opening' | 'bracket';
  opening: string | null;
  samples: number | null;
  feudal_s: number | null;
  castle_s: number | null;
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
    players: { name: string | null; civ: number | null }[];
    me: Cifras;
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

export default function LiveOverlay() {
  const { t } = useT();
  const { profileId } = useParams();
  const [params] = useSearchParams();
  const token = params.get('t') || '';
  //  ?bg=none para montarlo encima del juego en OBS, donde el fondo lo pone
  //  la captura y un panel opaco taparia la partida.
  const transparente = params.get('bg') === 'none';

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

  return (
    <div className={`${fondo} min-h-screen p-3`}>
      <div className="max-w-xs rounded-lg border border-stone-800 bg-stone-900/90 p-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-2">
          <span className="flex items-center gap-2 text-sm font-medium text-stone-100">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                res.live ? 'animate-pulse bg-emerald-400' : 'bg-stone-600'
              }`}
            />
            {me.name || `#${me.profile_id}`}
            {me.rating != null && (
              <span className="font-mono text-xs text-stone-400">{me.rating}</span>
            )}
          </span>
          {!res.live && <span className="text-xs text-stone-500">{t('ov.ended')}</span>}
        </div>

        {/*
          La apertura y contra que se compara, juntas y arriba: sin saber de
          que esta hecha la referencia los numeros de abajo no dicen nada.
        */}
        <div className="pt-2 pb-1">
          <p className="text-sm text-gold-400">{me.opening || '—'}</p>
          {ref && (
            <p className="text-xs text-stone-500">
              {ref.scope === 'opening'
                ? t('ov.refOpening', { n: String(ref.samples ?? '?'), b: me.bracket || '' })
                : t('ov.refBracket', { b: me.bracket || '' })}
            </p>
          )}
        </div>

        <div className="border-t border-stone-800 pt-1">
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
          <Fila etiqueta={t('ov.vills')} valor={me.villagers_15m == null ? '—' : String(me.villagers_15m)}>
            <Delta valor={me.villagers_15m} referencia={ref?.villagers_15m} menorEsMejor={false} />
          </Fila>
          <Fila etiqueta={t('ov.tcIdle')} valor={reloj(me.tc_idle_ms)} />
          <Fila etiqueta={t('ov.apm')} valor={me.apm == null ? '—' : String(me.apm)}>
            <Delta valor={me.apm} referencia={ref?.apm} menorEsMejor={false} decimales={1} />
          </Fila>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 border-t border-stone-800 pt-2 text-xs text-stone-500">
          {map_size && <span>{map_size}</span>}
          {flock_count != null && <span>· {t('ov.flock', { n: String(flock_count) })}</span>}
          {players.length > 1 && (
            <span className="truncate">· {players.map((p) => p.name).join(' / ')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
