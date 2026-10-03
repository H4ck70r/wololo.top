import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../lib/i18n';
import type { ReplayTimeline, TimelineEvent } from '../lib/types';

interface Props {
  timeline: ReplayTimeline;
}

/**
 * Los colores de jugador de Age of Empires II, por índice del juego. Se usa el
 * color que trae el replay para que el mapa se parezca a lo que el jugador vio.
 */
const COLORES = ['#8b8b8b', '#4a7fd4', '#d44a4a', '#3fa64f', '#d9c13c',
                 '#3fb8bd', '#9a56c4', '#9a9a9a', '#dd8b35'];

/**
 * Qué es cada building_id. Verificado contra replays reales por cantidad Y por
 * momento de aparición, no de memoria: la casa es lo primero que se construye
 * (minuto 0,0), el cuartel cae al 7,2 -el "60% del camino a Feudal" de las
 * guías-, la granja es lo más numeroso (276 en tres partidas) y el centro
 * urbano extra aparece al minuto 21.
 *
 * Lo que no está aquí se pinta igual, en gris y sin nombre: es mejor que
 * inventarle una etiqueta.
 */
const EDIFICIOS: Record<number, { es: string; en: string; r: number; clave: boolean }> = {
  70:  { es: 'Casa', en: 'House', r: 2, clave: false },
  50:  { es: 'Granja', en: 'Farm', r: 2, clave: false },
  68:  { es: 'Molino', en: 'Mill', r: 3, clave: false },
  562: { es: 'Campamento madera', en: 'Lumber camp', r: 3, clave: false },
  584: { es: 'Campamento minero', en: 'Mining camp', r: 3, clave: false },
  12:  { es: 'Cuartel', en: 'Barracks', r: 4, clave: true },
  87:  { es: 'Galería', en: 'Archery range', r: 4, clave: true },
  101: { es: 'Establo', en: 'Stable', r: 4, clave: true },
  103: { es: 'Herrería', en: 'Blacksmith', r: 3, clave: false },
  84:  { es: 'Mercado', en: 'Market', r: 4, clave: false },
  104: { es: 'Monasterio', en: 'Monastery', r: 4, clave: false },
  49:  { es: 'Taller de asedio', en: 'Siege workshop', r: 4, clave: false },
  209: { es: 'Universidad', en: 'University', r: 4, clave: false },
  79:  { es: 'Torre', en: 'Tower', r: 3, clave: true },
  82:  { es: 'Castillo', en: 'Castle', r: 6, clave: true },
  621: { es: 'Centro urbano', en: 'Town centre', r: 6, clave: true },
};

const VELOCIDADES = [15, 30, 60];
//  Nunca 1x: una partida de 35 minutos a tiempo real es inmirable. A 30x cabe
//  en 70 segundos, que es lo que dura una animación que se disfruta.
const VELOCIDAD_POR_DEFECTO = 30;
//  Cuánto tarda en apagarse una orden de movimiento, en tiempo de juego.
const ESTELA_MS = 25_000;

const reloj = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function ReplayMap({ timeline }: Props) {
  const { t, lang } = useT();
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [corriendo, setCorriendo] = useState(false);
  const [velocidad, setVelocidad] = useState(VELOCIDAD_POR_DEFECTO);
  const [ahora, setAhora] = useState(0);
  const ultimoCuadro = useRef<number | null>(null);

  const duracion = timeline.duracion_ms || 1;
  const lado = Math.max(timeline.limites.x_max, timeline.limites.y_max, 120) + 4;

  //  Los eventos y las órdenes vienen ya ordenados por tiempo, pero no cuesta
  //  nada asegurarlo: si no lo estuvieran, el dibujado iría a saltos.
  const eventos = useMemo(
    () => [...timeline.eventos].sort((a, b) => a.t - b.t),
    [timeline]
  );
  const ejercito = useMemo(
    () => [...timeline.ejercito].sort((a, b) => a.t - b.t),
    [timeline]
  );

  const colorDe = (numero: number) => {
    const j = timeline.jugadores.find((x) => x.numero === numero);
    return COLORES[(j?.color ?? numero) % COLORES.length];
  };

  //  Las marcas de la barra: los pases de edad de cada jugador y la rendición.
  const hitos = useMemo(() => {
    const TEC_EDAD: Record<number, string> = { 101: 'F', 102: 'C', 103: 'I' };
    const out: { t: number; etiqueta: string; j: number }[] = [];
    for (const e of eventos) {
      if (e.tipo === 'tech' && e.id != null && TEC_EDAD[e.id]) {
        out.push({ t: e.t, etiqueta: TEC_EDAD[e.id], j: e.j });
      } else if (e.tipo === 'resign') {
        out.push({ t: e.t, etiqueta: '✕', j: e.j });
      }
    }
    return out;
  }, [eventos]);

  useEffect(() => {
    if (!corriendo) {
      ultimoCuadro.current = null;
      return;
    }
    let vivo = true;
    const paso = (ts: number) => {
      if (!vivo) return;
      if (ultimoCuadro.current != null) {
        //  El avance se calcula con el tiempo REAL transcurrido entre cuadros,
        //  no sumando una constante: así la animación dura lo mismo en un
        //  portátil a 30 fps que en un monitor a 144.
        const dt = (ts - ultimoCuadro.current) * velocidad;
        setAhora((previo) => {
          const siguiente = previo + dt;
          if (siguiente >= duracion) {
            setCorriendo(false);
            return duracion;
          }
          return siguiente;
        });
      }
      ultimoCuadro.current = ts;
      requestAnimationFrame(paso);
    };
    const id = requestAnimationFrame(paso);
    return () => { vivo = false; cancelAnimationFrame(id); };
  }, [corriendo, velocidad, duracion]);

  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    //  Nítido en pantallas con densidad doble sin deformar el dibujo.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = c.clientWidth;
    if (c.width !== px * dpr) {
      c.width = px * dpr;
      c.height = px * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const esc = px / lado;

    ctx.fillStyle = '#12161c';
    ctx.fillRect(0, 0, px, px);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= lado; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i * esc, 0); ctx.lineTo(i * esc, px);
      ctx.moveTo(0, i * esc); ctx.lineTo(px, i * esc);
      ctx.stroke();
    }

    //  La estela del ejército primero, para que los edificios queden encima.
    for (const o of ejercito) {
      if (o.t > ahora) break;
      const edad = ahora - o.t;
      if (edad > ESTELA_MS) continue;
      const alfa = 0.5 * (1 - edad / ESTELA_MS);
      ctx.fillStyle = colorDe(o.j);
      ctx.globalAlpha = alfa;
      const r = Math.min(1 + Math.sqrt(o.n || 1) * 0.6, 5);
      ctx.beginPath();
      ctx.arc(o.x * esc, o.y * esc, r * esc * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    //  Edificios y murallas: persisten, porque el replay no dice cuándo caen.
    for (const e of eventos as TimelineEvent[]) {
      if (e.t > ahora) break;
      const color = colorDe(e.j);
      if (e.tipo === 'wall' && e.x != null && e.y != null) {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = Math.max(1.5, esc * 0.8);
        ctx.beginPath();
        ctx.moveTo(e.x * esc, e.y * esc);
        ctx.lineTo((e.x2 ?? e.x) * esc, (e.y2 ?? e.y) * esc);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (e.tipo === 'build' && e.x != null && e.y != null) {
        const def = e.id != null ? EDIFICIOS[e.id] : undefined;
        const r = (def?.r ?? 2) * esc * 0.5;
        ctx.fillStyle = def ? color : 'rgba(150,150,150,0.5)';
        ctx.globalAlpha = def?.clave ? 1 : 0.65;
        ctx.fillRect(e.x * esc - r, e.y * esc - r, r * 2, r * 2);
        if (def?.clave) {
          ctx.strokeStyle = 'rgba(255,255,255,0.55)';
          ctx.lineWidth = 1;
          ctx.strokeRect(e.x * esc - r, e.y * esc - r, r * 2, r * 2);
        }
        ctx.globalAlpha = 1;
      }
    }
  }, [ahora, eventos, ejercito, lado, timeline]);

  //  Lo que acaba de pasar, para que el que mira sepa qué está viendo.
  const reciente = useMemo(() => {
    const ventana = 45_000;
    const out: string[] = [];
    for (let i = eventos.length - 1; i >= 0; i -= 1) {
      const e = eventos[i];
      if (e.t > ahora) continue;
      if (ahora - e.t > ventana) break;
      if (e.tipo === 'build' && e.id != null) {
        const def = EDIFICIOS[e.id];
        if (def?.clave) out.push(`${reloj(e.t)} ${lang === 'es' ? def.es : def.en}`);
      } else if (e.tipo === 'resign') {
        out.push(`${reloj(e.t)} ${t('map.resigned')}`);
      }
      if (out.length >= 3) break;
    }
    return out;
  }, [ahora, eventos, lang, t]);

  return (
    <div>
      <div className="relative">
        <canvas ref={lienzo} className="w-full aspect-square rounded-lg border border-dark-400 block" />
        <div className="absolute top-2 left-2 text-xs tabular-nums text-gray-300 bg-dark-900/70 rounded px-2 py-1">
          {reloj(ahora)} / {reloj(duracion)}
        </div>
        {reciente.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-col gap-0.5">
            {reciente.map((r, i) => (
              <span key={i} className="text-[10px] text-gray-400 bg-dark-900/70 rounded px-1.5 py-0.5">
                {r}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button
          onClick={() => {
            if (ahora >= duracion) setAhora(0);
            setCorriendo((v) => !v);
          }}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gold-500/20 text-gold-300 border border-gold-500/30 hover:bg-gold-500/30"
        >
          {corriendo ? t('map.pause') : t('map.play')}
        </button>
        <div className="flex items-center gap-1">
          {VELOCIDADES.map((v) => (
            <button
              key={v}
              onClick={() => setVelocidad(v)}
              className={`px-2 py-1 text-xs rounded border ${
                velocidad === v
                  ? 'bg-dark-500 text-gray-200 border-dark-300'
                  : 'text-gray-500 border-dark-500 hover:text-gray-300'
              }`}
            >
              {v}×
            </button>
          ))}
        </div>
        <span className="text-[11px] text-gray-600 ml-auto">
          {t('map.speedNote', { s: String(Math.round(duracion / 1000 / velocidad)) })}
        </span>
      </div>

      <div className="relative mt-2">
        <input
          type="range"
          min={0}
          max={duracion}
          value={ahora}
          onChange={(e) => { setCorriendo(false); setAhora(Number(e.target.value)); }}
          className="w-full accent-gold-400"
          aria-label={t('map.scrub')}
        />
        {/* Los pases de edad marcados sobre la barra: son los momentos a los
            que uno quiere saltar. */}
        <div className="relative h-4 -mt-1 pointer-events-none">
          {hitos.map((h, i) => (
            <span
              key={i}
              className="absolute text-[9px] tabular-nums -translate-x-1/2"
              style={{ left: `${(h.t / duracion) * 100}%`, color: colorDe(h.j) }}
              title={reloj(h.t)}
            >
              {h.etiqueta}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {timeline.jugadores.map((j) => (
          <span key={j.numero} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorDe(j.numero) }} />
            {j.nombre}
          </span>
        ))}
      </div>

      <p className="text-[11px] text-gray-600 mt-3 m-0">{t('map.note')}</p>
    </div>
  );
}
