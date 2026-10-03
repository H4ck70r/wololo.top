import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../lib/i18n';
import type { ReplayTimeline } from '../lib/types';

interface Props {
  timeline: ReplayTimeline;
}

/**
 * La paleta de jugador de AoE2, en el orden que usa el juego y empezando en 0.
 *
 * Verificado contra una partida: maestro_006 trae color=1 y en el chat del
 * juego su nombre sale en ROJO, que es el 1 de esta lista. Antes el mapa ni
 * siquiera llegaba a leer este campo -la cronología no lo pasaba- y pintaba a
 * cada jugador por su número de hueco, así que los colores no tenían nada que
 * ver con los que se vieron en la partida.
 */
const COLORES = ['#4a7fd4', '#d44a4a', '#3fa64f', '#d9c13c',
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
  70:  { es: 'Casa', en: 'House', icono: '', r: 1.3, peso: 0 },
  50:  { es: 'Granja', en: 'Farm', icono: '', r: 1.3, peso: 0 },
  68:  { es: 'Molino', en: 'Mill', icono: '', r: 1.8, peso: 1 },
  562: { es: 'Camp. madera', en: 'Lumber camp', icono: '', r: 1.8, peso: 1 },
  584: { es: 'Camp. minero', en: 'Mining camp', icono: '', r: 1.8, peso: 1 },
  103: { es: 'Herrería', en: 'Blacksmith', icono: '', r: 2, peso: 2 },
  84:  { es: 'Mercado', en: 'Market', icono: '', r: 2, peso: 2 },
  209: { es: 'Universidad', en: 'University', icono: '', r: 2, peso: 2 },
  104: { es: 'Monasterio', en: 'Monastery', icono: '✝', r: 4.5, peso: 3 },
  12:  { es: 'Cuartel', en: 'Barracks', icono: '⚔', r: 5.5, peso: 4 },
  87:  { es: 'Galería', en: 'Archery range', icono: '➹', r: 5.5, peso: 4 },
  101: { es: 'Establo', en: 'Stable', icono: '♞', r: 5.5, peso: 4 },
  49:  { es: 'Asedio', en: 'Siege workshop', icono: '⚙', r: 5.5, peso: 4 },
  79:  { es: 'Torre', en: 'Tower', icono: '▲', r: 4, peso: 4 },
  82:  { es: 'Castillo', en: 'Castle', icono: '♜', r: 8, peso: 6 },
  621: { es: 'Centro urbano', en: 'Town centre', icono: '⌂', r: 8, peso: 5 },
};
//  Los que salen en la leyenda: los que cuentan una historia.
const EN_LEYENDA = [621, 82, 12, 87, 101, 49, 79, 104];

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

  /**
   * Dónde empezó cada jugador.
   *
   * El centro urbano inicial viene colocado al arrancar la partida, así que NO
   * hay ninguna orden BUILD para él y el replay no dice dónde está. Lo que sí
   * hay es la primera casa, que en AoE2 se planta pegada al centro urbano:
   * medido en cuatro jugadores de dos partidas, siempre se construye en el
   * minuto 0,1 y cae a entre 2 y 8 casillas del centro de la base.
   *
   * Por eso la marca es una estimación y se dice que lo es. Lo exacto saldría
   * de la lista de objetos de la cabecera, que todavía no leemos.
   */
  const inicios = useMemo(() => {
    const CASA = 70;
    const out = new Map<number, { x: number; y: number }>();
    for (const e of eventos) {
      if (e.tipo !== 'build' || e.x == null || e.y == null) continue;
      if (out.has(e.j)) continue;
      //  Se prefiere la primera casa; si el jugador abrió con otra cosa, vale
      //  su primer edificio.
      if (e.id === CASA || e.t > 60_000) out.set(e.j, { x: e.x, y: e.y });
    }
    return out;
  }, [eventos]);

  const colorDe = (numero: number) => {
    const j = timeline.jugadores.find((x) => x.numero === numero);
    //  El color del replay manda. Si falta -formatos viejos que lee mgz-, se
    //  cae al número de hueco, que al menos distingue a los jugadores.
    const idx = j?.color != null ? j.color : numero - 1;
    return COLORES[((idx % COLORES.length) + COLORES.length) % COLORES.length];
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
    //  (x - y), la proyección estándar de AoE2.
    //
    //  Esto bailó varias veces comparando capturas, así que queda la prueba.
    //  La clave fue mirar el interior de una base en vez de dónde cae la base
    //  entera: en aoe2insights los dos castillos de un jugador están en el
    //  lado DERECHO de su propia base, y eso sólo lo da (x - y); con (y - x)
    //  salen a la izquierda.
    //
    //  La proyección es lineal, así que las dos cosas no se pueden ajustar por
    //  separado: fijado el interior de la base, la posición de la base queda
    //  determinada. El interior es la señal más fiable de las dos, porque son
    //  edificios concretos en sitios concretos y no una impresión de conjunto.
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

    //  La posición de salida va siempre visible, también en el segundo cero:
    //  es la referencia que permite leer todo lo demás.
    for (const [j, p] of inicios) {
      const X = px(p.x, p.y);
      const Y = py(p.x, p.y);
      const r = Math.max(esc * 7, 12);
      ctx.strokeStyle = colorDe(j);
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(X, Y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = colorDe(j);
      ctx.fill();
      ctx.globalAlpha = 1;

      //  Con el nombre encima no hay que deducir quien esta donde, que es lo
      //  que hizo falta para enderezar la orientacion del mapa.
      const etiqueta = timeline.jugadores.find((x) => x.numero === j)?.nombre;
      if (etiqueta) {
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        //  Pegada al borde salia cortada, y un nombre a medias es peor que
        //  ninguno: fue lo que hizo leer la base propia como la del rival.
        const ancho_txt = ctx.measureText(etiqueta).width;
        const Xe = Math.min(Math.max(X, ancho_txt / 2 + 4), ancho - ancho_txt / 2 - 4);
        const Ye = Math.max(Y - r - 3, 14);
        ctx.strokeText(etiqueta, Xe, Ye);
        //  Blanco y no el color del jugador: el gris sobre fondo oscuro no se
        //  leia, y es justo el color que mas confusion causo.
        ctx.fillStyle = '#ffffff';
        ctx.fillText(etiqueta, Xe, Ye);
      }
    }

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
        //  Casas, granjas, campamentos: cuadraditos tenues. Son el relleno que
        //  dibuja la forma de la base; si compiten con los iconos no se ve
        //  nada, que es lo que pasaba antes.
        ctx.globalAlpha = def ? 0.55 : 0.35;
        ctx.fillStyle = def ? color : '#8b8b8b';
        const lado2 = Math.max(r * 0.9, 1.5);
        ctx.fillRect(X - lado2, Y - lado2, lado2 * 2, lado2 * 2);
        ctx.globalAlpha = 1;
        continue;
      }

      //  Lo que cuenta una historia: circulo del color del jugador, borde
      //  oscuro para separarlo del fondo y el icono en BLANCO encima. En negro
      //  sobre rojo o azul no se leia.
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(X, Y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const tam = Math.round(r * 1.35);
      if (tam >= 8) {
        ctx.font = `${tam}px system-ui, "Segoe UI Symbol", "Noto Sans Symbols 2", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        //  Halo oscuro para que el blanco se lea sobre cualquier color.
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.strokeText(def.icono, X, Y + tam * 0.06);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(def.icono, X, Y + tam * 0.06);
      }
    }
    ctx.restore();
  }, [ahora, eventos, ejercito, lado, inicios, timeline]);

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

      {/* Quien esta donde, escrito. Mirando colores sobre un rombo es facil
          leer la base propia como la del rival, sobre todo si a uno le toco el
          gris; en palabras no hay forma de equivocarse. */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {timeline.jugadores.map((j) => {
          const p = inicios.get(j.numero);
          const centro = lado / 2;
          let donde = '';
          if (p) {
            const ix = p.y - p.x;
            const iy = (p.x + p.y) / 2 - centro;
            const vert = iy < -lado * 0.08 ? t('map.top') : iy > lado * 0.08 ? t('map.bottom') : '';
            const horiz = ix < -lado * 0.08 ? t('map.left') : ix > lado * 0.08 ? t('map.right') : '';
            donde = [vert, horiz].filter(Boolean).join(' ') || t('map.centre');
          }
          return (
            <span key={j.numero} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorDe(j.numero) }} />
              {j.nombre}
              {donde && <span className="text-gray-600">· {donde}</span>}
            </span>
          );
        })}
      </div>

      {/* Sin leyenda los iconos son un acertijo, y sueltos sobre el fondo no
          se parecen a lo que se ve en el mapa. Van en su círculo. */}
      <div className="flex items-center gap-x-3 gap-y-1.5 mt-2 flex-wrap">
        {EN_LEYENDA.map((id) => {
          const d = EDIFICIOS[id];
          return (
            <span key={id} className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[11px] leading-none border border-black/60"
                style={{ background: '#6b7280' }}
              >
                {d.icono}
              </span>
              {lang === 'es' ? d.es : d.en}
            </span>
          );
        })}
        <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-500/60" />
          {t('map.filler')}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-gray-500" title={t('map.startHint')}>
          <span className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-gray-500" />
          {t('map.start')}
        </span>
      </div>

      <p className="text-[11px] text-gray-600 mt-3 m-0">{t('map.note')}</p>
    </div>
  );
}
