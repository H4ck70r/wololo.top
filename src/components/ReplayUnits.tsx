import { useMemo } from 'react';
import { useT } from '../lib/i18n';
import Nota from './Nota';
import { colorDeJugador, nombreDeJugador } from '../lib/jugadores';
import { CLASE_COLOR } from '../lib/units';
import { nombreUnidad, claseDeUnidad, raizDeLinea, nombreTecnologia, tecnologia,
         iconoUnidad, iconoTecnologia, fichaUnidad } from '../lib/juego';
import type { ReplayTimeline } from '../lib/types';

interface Props {
  timeline: ReplayTimeline;
  /** enseñar solo las unidades, sin el bloque de tecnologías */
  soloUnidades?: boolean;
  /** enseñar solo las tecnologías */
  soloTecnologias?: boolean;
}


//  Cubos de tres minutos y medio: suficientes para ver el ritmo sin que cada
//  barra sea una sola unidad.
const CUBO_MS = 210_000;
const ALDEANO = 83;
const EDADES: Record<number, string> = { 101: 'feudal', 102: 'castle', 103: 'imperial' };

const reloj = (ms: number) =>
  `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;

/**
 * Qué encargó cada jugador y cuándo.
 *
 * Importante y va dicho en la tarjeta: esto es lo que se ENCOLÓ, no lo que
 * llegó a existir. Si alguien pide cinco scouts y le tiran el establo, el
 * replay dice que los pidió. El fichero registra órdenes, no estado.
 */
export default function ReplayUnits({ timeline, soloUnidades, soloTecnologias }: Props) {
  const { t, lang } = useT();
  const colorJ = (numero: number) => colorDeJugador(timeline.jugadores, numero);
  const nombreJ = (numero: number) => nombreDeJugador(timeline.jugadores, numero);

  const datos = useMemo(() => {
    const porJugador = new Map<number, {
      total: Map<number, number>;
      cubos: Map<number, Map<number, number>>;
    }>();
    let maxCubo = 0;
    for (const e of timeline.eventos) {
      if (e.tipo !== 'queue' || e.id == null) continue;
      const n = e.n ?? 1;
      if (!porJugador.has(e.j)) porJugador.set(e.j, { total: new Map(), cubos: new Map() });
      const d = porJugador.get(e.j)!;
      //  Por raíz de línea: arqueros, ballesteros y arbalesteros son la misma
      //  unidad en tres momentos, y el jugador los piensa como una sola.
      const raiz = raizDeLinea(e.id);
      d.total.set(raiz, (d.total.get(raiz) ?? 0) + n);
      const cubo = Math.floor(e.t / CUBO_MS);
      if (!d.cubos.has(cubo)) d.cubos.set(cubo, new Map());
      const c = d.cubos.get(cubo)!;
      c.set(raiz, (c.get(raiz) ?? 0) + n);
      if (cubo > maxCubo) maxCubo = cubo;
    }
    //  La escala la marca el cubo más cargado de militar de cualquiera, para
    //  que las dos filas se puedan comparar a ojo.
    let techo = 1;
    for (const d of porJugador.values()) {
      for (const c of d.cubos.values()) {
        let mil = 0;
        for (const [id, n] of c) if (id !== ALDEANO) mil += n;
        if (mil > techo) techo = mil;
      }
    }
    //  Tecnologias por edad. Los nombres no se pueden poner todavia -el mapeo
    //  de id a nombre vive dentro del .dat del juego y es otro parser-, pero
    //  la CUENTA si: validada contra la pantalla de estadisticas del propio
    //  juego, que dio 28 y nosotros 28 para un jugador.
    //
    //  Para el otro dio 22 contra nuestras 20, y la diferencia tiene
    //  explicacion: jugaba Francos, que reciben gratis las mejoras de granja.
    //  Una tecnologia regalada por bonus de civilizacion no genera ninguna
    //  orden, asi que el replay no puede verla.
    const tecnologias = new Map<number, {
      total: Set<number>;
      porEdad: Map<string, number>;
      lista: { id: number; t: number; edad: string }[];
    }>();
    for (const e of timeline.eventos) {
      if (e.tipo !== 'tech' || e.id == null) continue;
      if (!tecnologias.has(e.j)) tecnologias.set(e.j, { total: new Set(), porEdad: new Map(), lista: [] });
      const d = tecnologias.get(e.j)!;
      if (EDADES[e.id]) continue;
      d.total.add(e.id);
    }
    //  A que edad pertenece cada una, por el momento en que se investigo.
    const hitosEdad = new Map<number, { feudal?: number; castle?: number; imperial?: number }>();
    for (const e of timeline.eventos) {
      if (e.tipo !== 'tech' || e.id == null || !EDADES[e.id]) continue;
      const h = hitosEdad.get(e.j) ?? {};
      const k = EDADES[e.id] as 'feudal' | 'castle' | 'imperial';
      if (h[k] == null) h[k] = e.t;
      hitosEdad.set(e.j, h);
    }
    for (const e of timeline.eventos) {
      if (e.tipo !== 'tech' || e.id == null || EDADES[e.id]) continue;
      const d = tecnologias.get(e.j);
      if (!d) continue;
      const h = hitosEdad.get(e.j) ?? {};
      const edad = h.imperial != null && e.t >= h.imperial ? 'imperial'
        : h.castle != null && e.t >= h.castle ? 'castle'
        : h.feudal != null && e.t >= h.feudal ? 'feudal' : 'dark';
      d.porEdad.set(edad, (d.porEdad.get(edad) ?? 0) + 1);
      if (!d.lista.some((x) => x.id === e.id)) d.lista.push({ id: e.id, t: e.t, edad });
    }

    return { porJugador, maxCubo, techo, tecnologias };
  }, [timeline]);


  const jugadores = [...datos.porJugador.keys()].sort((a, b) => a - b);
  if (!jugadores.length) return null;
  //  Por defecto se enseña todo; los dos modos existen para la vista con
  //  pestañas, donde unidades y tecnologías van separadas.
  const verUnidades = !soloTecnologias;
  const verTecnologias = !soloUnidades;

  return (
    <div className="mt-1">
      {verUnidades && (<>
      <h4 className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 m-0 mb-3">
        {t('units.title')}
        <Nota>
          {t('units.note')}
          <span className="block mt-2">{t('contra.nota')}</span>
        </Nota>
      </h4>

      <div className="grid gap-4 sm:grid-cols-2">
        {jugadores.map((j) => {
          const d = datos.porJugador.get(j)!;
          const lista = [...d.total.entries()]
            .filter(([id]) => id !== ALDEANO)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 7);
          const aldeanos = d.total.get(ALDEANO) ?? 0;
          const maxLista = lista.length ? lista[0][1] : 1;
          return (
            <div key={j} className="bg-dark-800/50 border border-dark-500/40 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorJ(j) }} />
                <span className="text-sm font-medium text-gray-200">{nombreJ(j)}</span>
                <span className="text-xs text-gray-500 ml-auto tabular-nums">
                  {aldeanos} {t('units.vils')}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {lista.map(([id, n]) => (
                  <div key={id} className="flex items-center gap-2">
                    {/* El icono del propio juego: una lista con los dibujos
                        que uno ya reconoce se lee de un vistazo. */}
                    <span className="flex items-center gap-1.5 w-32 min-w-0" title={nombreUnidad(id, lang)}>
                      {iconoUnidad(id) && (
                        <img src={iconoUnidad(id)!} alt="" width={20} height={20}
                             className="w-5 h-5 shrink-0 rounded-sm" loading="lazy" />
                      )}
                      <span className="text-xs text-gray-400 truncate">{nombreUnidad(id, lang)}</span>
                      {(() => {
                        //  Que es y contra que sirve, en palabras del juego.
                        //  Va detras del icono porque es contexto: lo que se
                        //  viene a ver es cuanto saco cada uno.
                        const f = fichaUnidad(id, lang);
                        if (!f || (!f.fuerte && !f.debil)) return null;
                        return (
                          <Nota>
                            <span className="block font-medium text-gray-300">{nombreUnidad(id, lang)}</span>
                            {f.rol && <span className="block mt-0.5">{f.rol}</span>}
                            {f.fuerte && (
                              <span className="block mt-1.5">
                                <span className="text-win">{t('contra.fuerte')}</span> {f.fuerte}
                              </span>
                            )}
                            {f.debil && (
                              <span className="block mt-0.5">
                                <span className="text-loss">{t('contra.debil')}</span> {f.debil}
                              </span>
                            )}
                          </Nota>
                        );
                      })()}
                    </span>
                    <span className="flex-1 h-2 rounded-full bg-dark-600 overflow-hidden">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${(n / maxLista) * 100}%`, background: CLASE_COLOR[claseDeUnidad(id)] }}
                      />
                    </span>
                    <span className="text-xs tabular-nums text-gray-300 w-7 text-right">{n}</span>
                  </div>
                ))}
                {!lista.length && (
                  <p className="text-xs text-gray-600 m-0">{t('units.onlyVils')}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h5 className="text-xs uppercase tracking-wide text-gray-500 mt-5 mb-2">
        {t('units.overTime')}
      </h5>
      <div className="flex flex-col gap-2">
        {jugadores.map((j) => {
          const d = datos.porJugador.get(j)!;
          return (
            <div key={j}>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-sm" style={{ background: colorJ(j) }} />
                <span className="text-xs text-gray-400">{nombreJ(j)}</span>
              </div>
              <div className="flex items-stretch gap-px h-16">
                {Array.from({ length: datos.maxCubo + 1 }, (_, k) => {
                  const c = d.cubos.get(k);
                  const porClase = new Map<string, number>();
                  let mil = 0;
                  if (c) {
                    for (const [id, n] of c) {
                      if (id === ALDEANO) continue;
                      const cl = claseDeUnidad(id);
                      porClase.set(cl, (porClase.get(cl) ?? 0) + n);
                      mil += n;
                    }
                  }
                  return (
                    <div
                      key={k}
                      className="flex-1 h-full flex flex-col justify-end"
                      title={`${reloj(k * CUBO_MS)} – ${reloj((k + 1) * CUBO_MS)}: ${mil}`}
                    >
                      {[...porClase.entries()].map(([cl, n]) => (
                        <span
                          key={cl}
                          className="block w-full"
                          style={{
                            //  Minimo visible: una unidad suelta tiene que
                            //  dejar rastro, si no el grafico miente por
                            //  omision en los minutos flojos.
                            height: `${Math.max((n / datos.techo) * 100, 3)}%`,
                            background: CLASE_COLOR[cl as keyof typeof CLASE_COLOR],
                          }}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
        <span>0:00</span>
        <span>{reloj(timeline.duracion_ms)}</span>
      </div>
      {/* Sin leyenda las barras de colores son adorno. */}
      <div className="flex gap-x-3 gap-y-1 mt-2 flex-wrap">
        {(['inf', 'tiro', 'cab', 'asedio', 'otros'] as const).map((cl) => (
          <span key={cl} className="flex items-center gap-1 text-[11px] text-gray-500">
            <span className="w-2 h-2 rounded-sm" style={{ background: CLASE_COLOR[cl] }} />
            {t(`units.class.${cl}` as never)}
          </span>
        ))}
      </div>
      </>)}

      {verTecnologias && datos.tecnologias.size > 0 && (
        <div className="mt-5">
          <h5 className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 m-0 mb-3">
            {t('units.techTitle')}
            <Nota>{t('units.techNote')}</Nota>
          </h5>
          <div className="grid gap-2 sm:grid-cols-2">
            {jugadores.map((j) => {
              const d = datos.tecnologias.get(j);
              if (!d) return null;
              return (
                <div key={j} className="bg-dark-800/50 border border-dark-500/40 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorJ(j) }} />
                    <span className="text-sm text-gray-200">{nombreJ(j)}</span>
                    <span className="text-xs text-gray-400 ml-auto tabular-nums">
                      {d.total.size} {t('units.techs')}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500 mb-2">
                    {(['dark', 'feudal', 'castle', 'imperial'] as const).map((e) => (
                      <span key={e} className="tabular-nums">
                        {t(`units.age.${e}` as never)} {d.porEdad.get(e) ?? 0}
                      </span>
                    ))}
                  </div>
                  {/* Con nombre y minuto: saber que investigo Balistica en el
                      24:10 dice algo; saber que investigo "17 cosas" no. */}
                  <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto pr-1">
                    {[...d.lista].sort((a, b) => a.t - b.t).map((x) => {
                      const f = tecnologia(x.id);
                      return (
                        <div key={x.id} className="flex items-baseline gap-2 text-xs">
                          <span className="tabular-nums text-gray-600 w-9">{reloj(x.t)}</span>
                          {iconoTecnologia(x.id) && (
                            <img src={iconoTecnologia(x.id)!} alt="" width={16} height={16}
                                 className="w-4 h-4 shrink-0 rounded-sm" loading="lazy" />
                          )}
                          <span className={f?.unique ? 'text-gold-400/90' : 'text-gray-300'}>
                            {nombreTecnologia(x.id, lang)}
                          </span>
                          {f?.unique && (
                            <span className="text-[10px] text-gray-600">{f.civ ?? ''}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
