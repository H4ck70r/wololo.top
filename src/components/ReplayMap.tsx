import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '../lib/i18n';
import { colorDeJugador } from '../lib/jugadores';
import type { ReplayTimeline } from '../lib/types';
import { nombreEdificio } from '../lib/juego';
import { expandir, paletaDelMapa, resumenTerreno } from '../lib/terreno';

interface Props {
  timeline: ReplayTimeline;
}


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

/**
 * Los recursos del mapa. Van en los colores con los que el juego los pinta en
 * su minimapa, que es donde el jugador ya los reconoce sin pensar.
 *
 * Las especies de animal no se separan: los ids clásicos de oveja y jabalí no
 * aparecen en esta versión del juego, así que se marcan todos como animal en
 * vez de inventarles especie. Lo que importa para leer el mapa es dónde hay
 * comida, no si son ovejas o ciervos.
 */
const COLOR_RECURSO: Record<string, string> = {
  oro: '#e0b33a',
  piedra: '#c9c9c9',
  rebano: '#e8e2d0',   // ovejas: claras, como en el juego
  caza: '#b5703c',     // ciervos y jabalies
  pesca: '#5ab0d9',
  fauna: '#6a6a5a',    // lo que nadie toca, apagado
};

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
  const colorDe = (numero: number) => colorDeJugador(timeline.jugadores, numero);
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

  /** El terreno, descomprimido una sola vez por partida. */
  const suelo = useMemo(() => {
    const s = timeline.suelo;
    if (!s) return null;
    const total = s.lado * s.lado;
    const terreno = expandir(s.terreno, total);
    const paleta = paletaDelMapa(terreno);
    return { lado: s.lado, terreno, paleta, resumen: resumenTerreno(terreno, paleta) };
  }, [timeline]);


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

    //  La proyección: ix = x + y, iy = (y - x) / 2.
    //
    //  Esto costó varias vueltas porque estaba probando espejos cuando lo que
    //  hacía falta era una rotación de 90 grados: los ejes estaban
    //  intercambiados, y ningún espejo arregla eso.
    //
    //  Se decidió con las ocho orientaciones posibles dibujadas sobre los
    //  datos reales de una partida y DOS criterios a la vez: dónde cae la base
    //  de un jugador y dónde quedan los dos castillos del otro DENTRO de su
    //  propia base. Sólo una las cumple las dos, y es ésta.
    //
    //  Las esquinas salen donde deben: (0,0) a la izquierda, (lado,0) arriba,
    //  (lado,lado) a la derecha y (0,lado) abajo.
    const esc = Math.min(ancho / (lado * 2), alto / lado);
    const despX = (ancho - lado * 2 * esc) / 2;
    const despY = (alto - lado * esc) / 2;
    const px = (x: number, y: number) => (x + y) * esc + despX;
    const py = (x: number, y: number) => ((y - x + lado) / 2) * esc + despY;

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

    //  El terreno, casilla a casilla. Es lo que convierte el mapa en un sitio
    //  reconocible en vez de puntos sobre un rombo vacío: los bosques y el agua
    //  son lo que uno usa para orientarse.
    if (suelo) {
      const paso = Math.max(1, Math.floor(1 / Math.max(esc, 0.01)));
      for (let y = 0; y < suelo.lado; y += paso) {
        for (let x = 0; x < suelo.lado; x += paso) {
          const tid = suelo.terreno[y * suelo.lado + x];
          ctx.fillStyle = suelo.paleta.get(tid) ?? '#8a7a52';
          //  Cada casilla es un rombo en isométrico; se pinta como tal para
          //  que no queden costuras entre casillas vecinas.
          const cx = px(x + 0.5, y + 0.5);
          const cy = py(x + 0.5, y + 0.5);
          const w = esc * 1.05;
          const h = esc * 0.55;
          ctx.beginPath();
          ctx.moveTo(cx, cy - h);
          ctx.lineTo(cx + w, cy);
          ctx.lineTo(cx, cy + h);
          ctx.lineTo(cx - w, cy);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

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

    //  Los recursos, encima del terreno y debajo de todo lo demás: son el
    //  decorado que explica por qué las bases están donde están.
    //
    //  Dos cosas que el replay sí permite y que parecían imposibles: el rebaño
    //  se MUEVE -a una oveja hay que darle orden para llevarla al centro
    //  urbano, y esa orden está en el fichero-, y se sabe CUÁNDO se fue a por
    //  cada cosa, porque la orden apunta al objeto por su identificador.
    //
    //  Y se van del mapa cuando se acaban. La muerte NO está en el fichero,
    //  pero sí quién recibe cada orden y a qué: si los aldeanos que trabajaban
    //  un ciervo reciben orden sobre otra cosa, ese ciervo dejó de dar comida.
    //  Medido en una partida, 24 animales trabajados y 24 con final detectado,
    //  con duraciones que cuadran -oveja por debajo de dos minutos, jabalí
    //  entre uno y tres-.
    //
    //  El límite, que la leyenda dice: un aldeano también cambia de tarea
    //  porque lo matan o porque el jugador cambia de idea, así que algún final
    //  sale antes de tiempo.
    for (const r of timeline.recursos ?? []) {
      let rx = r.x;
      let ry = r.y;
      if (r.pasos) {
        for (const [tp, mx, my] of r.pasos) {
          if (tp > ahora) break;
          rx = mx; ry = my;
        }
      }
      //  Se desvanece en los últimos quince segundos en vez de parpadear:
      //  un recurso que desaparece de golpe se lee como un fallo de dibujo.
      const DESVANECE_MS = 15_000;
      let opacidad = 0.95;
      if (r.agotado_ms != null && ahora >= r.agotado_ms) {
        const pasado = ahora - r.agotado_ms;
        if (pasado > DESVANECE_MS) continue;
        opacidad = 0.5 * (1 - pasado / DESVANECE_MS);
      } else if (r.usado_ms != null && r.usado_ms <= ahora) {
        opacidad = 0.35;
      }
      const X = px(rx, ry);
      const Y = py(rx, ry);
      ctx.fillStyle = COLOR_RECURSO[r.t] ?? '#999';
      ctx.globalAlpha = opacidad;
      const rad = Math.max(esc * (r.t === 'oro' || r.t === 'piedra' ? 1 : 0.85), 1.4);
      ctx.beginPath();
      ctx.arc(X, Y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    //  La posición de salida va siempre visible, también en el segundo cero:
    //  es la referencia que permite leer todo lo demás. Se dibuja con el
    //  mismo símbolo que un centro urbano porque eso es lo que hay ahí; que
    //  sea una estimación se dice en la leyenda, no ensuciando el mapa.
    for (const [j, p] of inicios) {
      const X = px(p.x, p.y);
      const Y = py(p.x, p.y);
      const r = Math.max(esc * 4.5, 9);
      ctx.fillStyle = colorDe(j);
      ctx.beginPath();
      ctx.arc(X, Y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const tam = Math.round(r * 1.35);
      ctx.font = `${tam}px system-ui, "Segoe UI Symbol", "Noto Sans Symbols 2", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.strokeText('⌂', X, Y + tam * 0.06);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('⌂', X, Y + tam * 0.06);

      //  Con el nombre encima no hay que deducir quién está dónde.
      const etiqueta = timeline.jugadores.find((x) => x.numero === j)?.nombre;
      if (etiqueta) {
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.textBaseline = 'bottom';
        const ancho_txt = ctx.measureText(etiqueta).width;
        const Xe = Math.min(Math.max(X, ancho_txt / 2 + 4), ancho - ancho_txt / 2 - 4);
        const Ye = Math.max(Y - r - 3, 14);
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        ctx.strokeText(etiqueta, Xe, Ye);
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
  }, [ahora, eventos, ejercito, lado, inicios, suelo, timeline]);

  const reciente = useMemo(() => {
    const ventana = 45_000;
    const out: string[] = [];
    for (let i = eventos.length - 1; i >= 0; i -= 1) {
      const e = eventos[i];
      if (e.t > ahora) continue;
      if (ahora - e.t > ventana) break;
      if (e.tipo === 'build' && e.id != null) {
        const def = EDIFICIOS[e.id];
        if (def && def.peso >= 3) out.push(`${reloj(e.t)} ${nombreEdificio(e.id, lang)}`);
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
          let donde = '';
          if (p) {
            //  La misma proyección que el dibujo: si no, el texto miente.
            const ix = p.x + p.y - lado;
            const iy = (p.y - p.x) / 2;
            const vert = iy < -lado * 0.08 ? t('map.top') : iy > lado * 0.08 ? t('map.bottom') : '';
            const horiz = ix < -lado * 0.08 ? t('map.left') : ix > lado * 0.08 ? t('map.right') : '';
            donde = [vert, horiz].filter(Boolean).join(' ') || t('map.center');
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

      {/* Plegada por defecto: ocupaba cuatro filas bajo el mapa y el mapa es
          lo que se quiere mirar. La línea de jugadores queda fuera porque sin
          ella no se sabe quién es quién, que es lo único imprescindible. */}
      <details className="mt-2 group relative">
        {/* inline-block y sin marcador: como caja a todo lo ancho reservaba
            una fila entera aunque estuviese plegada. */}
        <summary className="inline-block text-[11px] text-gray-500 cursor-pointer hover:text-gray-300 list-none select-none marker:hidden [&::-webkit-details-marker]:hidden focus:outline-none">
          {t('map.legend')} <span className="group-open:hidden">▸</span><span className="hidden group-open:inline">▾</span>
        </summary>
        {/* Flotante: desplegada empujaba todo lo de abajo y la tarjeta
            entera cambiaba de alto. Asi se abre encima y no mueve nada. */}
        <div className="absolute z-20 left-0 right-0 mt-2 p-3 rounded-lg bg-dark-800 border border-dark-400 shadow-xl">
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
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[11px] leading-none border border-black/60"
                  style={{ background: '#6b7280' }}>⌂</span>
            {t('map.start')}
          </span>
        </div>

        {(timeline.recursos?.length ?? 0) > 0 && (
          <div className="flex items-center gap-x-3 gap-y-1 mt-2 flex-wrap">
            {(['rebano', 'caza', 'oro', 'piedra', 'pesca'] as const).map((k) => {
              const n = (timeline.recursos ?? []).filter((r) => r.t === k).length;
              if (!n) return null;
              return (
                <span key={k} className="flex items-center gap-1.5 text-[11px] text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLOR_RECURSO[k] }} />
                  {t(`map.res.${k}` as never)} {n}
                </span>
              );
            })}
          </div>
        )}

        {suelo && (
          <div className="flex items-center gap-x-3 gap-y-1 mt-2 flex-wrap">
            {suelo.resumen.slice(0, 6).map((r) => (
              <span key={r.id} className="flex items-center gap-1.5 text-[11px] text-gray-500"
                    title={t('map.terrainHint')}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: r.color }} />
                {t('map.terrainId', { id: String(r.id) })} {r.pct.toFixed(0)}%
              </span>
            ))}
          </div>
        )}


        <p className="text-[11px] text-gray-600 mt-3 m-0">{t('map.note')}</p>
        </div>
      </details>

    </div>
  );
}
