import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../lib/i18n';
import type { ReplayTimeline } from '../lib/types';

interface Props {
  timeline: ReplayTimeline;
}

/** Los colores de jugador del juego, por índice, para que el mapa se parezca
 *  a lo que el jugador vio en su partida. */
const COLORES = ['#8b8b8b', '#4a7fd4', '#d44a4a', '#3fa64f', '#d9c13c',
                 '#3fb8bd', '#9a56c4', '#9a9a9a', '#dd8b35'];

/**
 * Qué es cada building_id, con su icono.
 *
 * Verificado contra replays reales por cantidad Y por momento de aparición: la
 * casa es lo primero que se construye (minuto 0,0), el cuartel cae al 7,2 -el
 * "60% del camino a Feudal" de las guías-, la granja es lo más numeroso y el
 * centro urbano extra aparece sobre el minuto 21.
 *
 * `peso` ordena el dibujado: lo importante se pinta al final para que no
 * quede debajo de una granja.
 */
type Edificio = { es: string; en: string; icono: string; r: number; peso: number };
const EDIFICIOS: Record<number, Edificio> = {
  70:  { es: 'Casa', en: 'House', icono: '', r: 1.6, peso: 0 },
  50:  { es: 'Granja', en: 'Farm', icono: '', r: 1.6, peso: 0 },
  68:  { es: 'Molino', en: 'Mill', icono: '◍', r: 2.4, peso: 1 },
  562: { es: 'Camp. madera', en: 'Lumber camp', icono: '◍', r: 2.4, peso: 1 },
  584: { es: 'Camp. minero', en: 'Mining camp', icono: '◍', r: 2.4, peso: 1 },
  12:  { es: 'Cuartel', en: 'Barracks', icono: '⚔', r: 3.4, peso: 3 },
  87:  { es: 'Galería', en: 'Archery range', icono: '➹', r: 3.4, peso: 3 },
  101: { es: 'Establo', en: 'Stable', icono: '♞', r: 3.4, peso: 3 },
  49:  { es: 'Asedio', en: 'Siege workshop', icono: '⚙', r: 3.4, peso: 3 },
  103: { es: 'Herrería', en: 'Blacksmith', icono: '⚒', r: 2.6, peso: 2 },
  84:  { es: 'Mercado', en: 'Market', icono: '⚖', r: 2.6, peso: 2 },
  104: { es: 'Monasterio', en: 'Monastery', icono: '✝', r: 2.6, peso: 2 },
  209: { es: 'Universidad', en: 'University', icono: '✦', r: 2.6, peso: 2 },
  79:  { es: 'Torre', en: 'Tower', icono: '♖', r: 2.8, peso: 3 },
  82:  { es: 'Castillo', en: 'Castle', icono: '♜', r: 5, peso: 5 },
  621: { es: 'Centro urbano', en: 'Town centre', icono: '⌂', r: 5, peso: 4 },
};
//  Los que salen en la leyenda: los que cuentan una historia.
const EN_LEYENDA = [621, 82, 12, 87, 101, 49, 79];

const VELOCIDADES = [15, 30, 60];
//  Nunca 1x: 35 minutos a tiempo real es inmirable. A 30x cabe en 70 segundos.
const VELOCIDAD_POR_DEFECTO = 30;
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

  const eventos = useMemo(
    () => [...timeline.eventos].sort((a, b) => a.t - b.t),
    [timeline]
  );
  const ejercito = useMemo(
    () => [...timeline.ejercito].sort((a, b) => a.t - b.t),
    [timeline]
  );

  /**
   * El encuadre: el mapa ENTERO, no solo donde hubo acción.
   *
   * Dos cosas que lo rompían. El mapa de Age es un rombo 2:1 -el doble de
   * ancho que de alto-, no un cuadrado girado: por eso se gira con la vertical
   * a la mitad. Y encuadrar sobre los eventos dejaba la partida minúscula,
   * porque bastaba una orden de ejército perdida para estirar el marco; además
   * el mapa entero dice algo que el recorte no dice, que es quién estaba
   * arriba y quién abajo.
   */
  const lado = timeline.lado_mapa ?? Math.max(
    120,
    Math.ceil(Math.max(timeline.limites.x_max, timeline.limites.y_max) / 8) * 8
  );

  const colorDe = (numero: number) => {
    const j = timeline.jugadores.find((x) => x.numero === numero);
    return COLORES[(j?.color ?? numero) % COLORES.length];
  };

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
    if (!corriendo) { ultimoCuadro.current = null; return; }
    let vivo = true;
    const paso = (ts: number) => {
      if (!vivo) return;
      if (ultimoCuadro.current != null) {
        //  Con el tiempo REAL entre cuadros, no sumando una constante: así
        //  dura lo mismo a 30 fps que a 144.
        const dt = (ts - ultimoCuadro.current) * velocidad;
        setAhora((previo) => {
          const siguiente = previo + dt;
          if (siguiente >= duracion) { setCorriendo(false); return duracion; }
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

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ancho = c.clientWidth;
    const alto = c.clientHeight;
    if (c.width !== ancho * dpr || c.height !== alto * dpr) {
      c.width = ancho * dpr;
      c.height = alto * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    //  El rombo ocupa 2*lado de ancho y lado de alto: de ahí el 2:1.
    const esc = Math.min(ancho / (lado * 2), alto / lado);
    const despX = (ancho - lado * 2 * esc) / 2 + lado * esc;
    const despY = (alto - lado * esc) / 2;
    const px = (x: number, y: number) => (x - y) * esc + despX;
    const py = (x: number, y: number) => ((x + y) / 2) * esc + despY;

    ctx.fillStyle = '#0d1116';
    ctx.fillRect(0, 0, ancho, alto);

    //  El rombo del mapa, para que se vea dónde acaba el terreno.
    ctx.beginPath();
    ctx.moveTo(px(0, 0), py(0, 0));
    ctx.lineTo(px(lado, 0), py(lado, 0));
    ctx.lineTo(px(lado, lado), py(lado, lado));
    ctx.lineTo(px(0, lado), py(0, lado));
    ctx.closePath();
    ctx.fillStyle = '#18202a';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.save();
    ctx.clip();

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let v = 0; v <= lado; v += 20) {
      ctx.beginPath();
      ctx.moveTo(px(v, 0), py(v, 0)); ctx.lineTo(px(v, lado), py(v, lado));
      ctx.moveTo(px(0, v), py(0, v)); ctx.lineTo(px(lado, v), py(lado, v));
      ctx.stroke();
    }

    for (const o of ejercito) {
      if (o.t > ahora) break;
      const edad = ahora - o.t;
      if (edad > ESTELA_MS) continue;
      ctx.globalAlpha = 0.45 * (1 - edad / ESTELA_MS);
      ctx.fillStyle = colorDe(o.j);
      const r = Math.min(1 + Math.sqrt(o.n || 1) * 0.5, 4) * esc * 0.5;
      ctx.beginPath();
      ctx.arc(px(o.x, o.y), py(o.x, o.y), Math.max(r, 1.2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    //  Murallas debajo de los edificios, y gruesas: antes no se veían.
    for (const e of eventos) {
      if (e.t > ahora) break;
      if (e.tipo !== 'wall' || e.x == null || e.y == null) continue;
      ctx.strokeStyle = colorDe(e.j);
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = Math.max(2, esc * 1.4);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px(e.x, e.y), py(e.x, e.y));
      ctx.lineTo(px(e.x2 ?? e.x, e.y2 ?? e.y), py(e.x2 ?? e.x, e.y2 ?? e.y));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    //  Los edificios por orden de importancia, para que un castillo no quede
    //  debajo de una granja.
    const construidos = eventos.filter(
      (e) => e.tipo === 'build' && e.t <= ahora && e.x != null && e.y != null
    );
    construidos.sort(
      (a, b) => (EDIFICIOS[a.id ?? -1]?.peso ?? 0) - (EDIFICIOS[b.id ?? -1]?.peso ?? 0)
    );

    for (const e of construidos) {
      const def = e.id != null ? EDIFICIOS[e.id] : undefined;
      const color = colorDe(e.j);
      const X = px(e.x!, e.y!);
      const Y = py(e.x!, e.y!);
      const r = Math.max((def?.r ?? 1.8) * esc * 0.55, 2);

      if (!def || !def.icono) {
        //  Casas, granjas y lo no identificado: puntos tenues. Son el relleno
        //  que da forma a la base sin tapar lo que importa.
        ctx.globalAlpha = def ? 0.5 : 0.3;
        ctx.fillStyle = def ? color : '#8b8b8b';
        ctx.beginPath();
        ctx.arc(X, Y, Math.max(r * 0.8, 1.2), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(X, Y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();

      const tam = Math.round(r * 1.5);
      if (tam >= 7) {
        ctx.fillStyle = '#0f1318';
        ctx.font = `${tam}px system-ui, "Segoe UI Symbol", "Noto Sans Symbols 2", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.icono, X, Y + tam * 0.06);
      }
    }
    ctx.restore();
  }, [ahora, eventos, ejercito, lado, timeline]);

  const reciente = useMemo(() => {
    const ventana = 45_000;
    const out: string[] = [];
    for (let i = eventos.length - 1; i >= 0; i -= 1) {
      const e = eventos[i];
      if (e.t > ahora) continue;
      if (ahora - e.t > ventana) break;
      if (e.tipo === 'build' && e.id != null) {
        const def = EDIFICIOS[e.id];
        if (def && def.peso >= 3) out.push(`${reloj(e.t)} ${lang === 'es' ? def.es : def.en}`);
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
        <canvas ref={lienzo} className="w-full aspect-[2/1] rounded-lg border border-dark-400 block" />
        <div className="absolute top-2 left-2 text-xs tabular-nums text-gray-300 bg-dark-900/75 rounded px-2 py-1">
          {reloj(ahora)} / {reloj(duracion)}
        </div>
        {reciente.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-col gap-0.5">
            {reciente.map((r, i) => (
              <span key={i} className="text-[10px] text-gray-300 bg-dark-900/75 rounded px-1.5 py-0.5">
                {r}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button
          onClick={() => { if (ahora >= duracion) setAhora(0); setCorriendo((v) => !v); }}
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
                velocidad === v ? 'bg-dark-500 text-gray-200 border-dark-300'
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
          type="range" min={0} max={duracion} value={ahora}
          onChange={(e) => { setCorriendo(false); setAhora(Number(e.target.value)); }}
          className="w-full accent-gold-400" aria-label={t('map.scrub')}
        />
        <div className="relative h-4 -mt-1 pointer-events-none">
          {hitos.map((h, i) => (
            <span key={i}
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

      {/* Sin leyenda los iconos son un acertijo. */}
      <div className="flex items-center gap-x-4 gap-y-1 mt-2 flex-wrap">
        {EN_LEYENDA.map((id) => {
          const d = EDIFICIOS[id];
          return (
            <span key={id} className="flex items-center gap-1 text-[11px] text-gray-500">
              <span className="text-gray-300">{d.icono}</span>
              {lang === 'es' ? d.es : d.en}
            </span>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-600 mt-3 m-0">{t('map.note')}</p>
    </div>
  );
}
