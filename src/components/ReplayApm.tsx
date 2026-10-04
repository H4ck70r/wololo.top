import { useQuery } from '@tanstack/react-query';
import { getLevelBenchmarks } from '../lib/api';
import { useT } from '../lib/i18n';
import { colorDeJugador, nombreDeJugador } from '../lib/jugadores';
import type { ReplayTimeline, LevelBenchmarksResponse } from '../lib/types';

interface Props {
  timeline: ReplayTimeline;
}

/**
 * El ritmo de juego.
 *
 * Dos cifras y no una: las acciones por minuto, y las EFECTIVAS. Dos órdenes
 * iguales a las mismas unidades y casi seguidas cuentan una sola, porque en
 * una pelea se repite el mismo clic de ataque muchas veces y eso infla el
 * número sin hacer nada nuevo.
 *
 * Todo va en minutos de reloj de JUEGO, que corre a 1,7x el real: es el reloj
 * que se ve en pantalla y el que usan las guías.
 *
 * El reparto entre mandar y construir va por TIPO DE COMANDO y no por tipo de
 * unidad, porque el replay no dice qué es cada objeto.
 */
export default function ReplayApm({ timeline }: Props) {
  const { t } = useT();
  const ritmo = timeline.ritmo ?? {};

  //  La referencia de su propia franja, que es lo que convierte un numero en
  //  un juicio: 40 por minuto no dice nada hasta saber que su nivel hace 32.
  const { data: referencias } = useQuery<LevelBenchmarksResponse>({
    queryKey: ['levelBenchmarks', '6'],
    queryFn: () => getLevelBenchmarks({ match_type: '6' }),
    staleTime: 30 * 60 * 1000,
  });
  const refDeFranja = (rating?: number) => {
    if (rating == null || !referencias) return null;
    const franja = rating < 1000 ? '<1000' : rating < 1200 ? '1000-1200'
      : rating < 1400 ? '1200-1400' : rating < 1600 ? '1400-1600' : '1600+';
    const b = referencias.brackets.find((x) => x.bracket === franja);
    return b && !b.thin && b.apm != null ? { franja, apm: b.apm } : null;
  };
  const colorDe = (n: number) => colorDeJugador(timeline.jugadores, n);
  const nombreJ = (n: number) => nombreDeJugador(timeline.jugadores, n);

  const series = timeline.jugadores.map((j) => {
    const s = ritmo[String(j.numero)] ?? [];
    const minutos = s.length || 1;
    const mando = s.reduce((a, x) => a + x[1], 0);
    const gestion = s.reduce((a, x) => a + x[2], 0);
    const efectivas = s.reduce((a, x) => a + (x[3] ?? 0), 0);
    const total = mando + gestion;
    return {
      numero: j.numero,
      serie: s,
      apm: Math.round(total / minutos),
      eapm: Math.round(efectivas / minutos),
      pico: s.reduce((m, x) => Math.max(m, x[3] ?? 0), 0),
      repetido: total ? Math.round(100 * (1 - efectivas / total)) : 0,
      mando, gestion, total,
    };
  }).filter((x) => x.serie.length);

  /**
   * La atencion, a partir de la camara del que grabo la rec.
   *
   * Dos cifras: en que parte del mapa pasaba el tiempo, y cuanto tardaba en
   * mirar cuando le metian unidades en casa. La segunda es la util: enterarse
   * tarde de un ataque cuesta mas que cualquier numero de APM.
   */
  const RADIO_BASE = 22;       // casillas que se consideran "su base"
  const RADIO_LLEGADA = 16;    // cuando se da por mirado un sitio
  const UNIDADES_ATAQUE = 6;
  const SEPARA_ATAQUES_MS = 120_000;

  const ojo = (() => {
    const vista = timeline.vista ?? [];
    const dueno = timeline.vista_de ?? null;
    if (!vista.length || dueno == null) return null;

    //  La base de cada uno: su primera construccion.
    const bases = new Map<number, { x: number; y: number }>();
    for (const e of timeline.eventos) {
      if (e.tipo !== 'build' || e.x == null || e.y == null) continue;
      if (!bases.has(e.j)) bases.set(e.j, { x: e.x, y: e.y });
    }
    const propia = bases.get(dueno);
    const rivalNum = timeline.jugadores.find((j) => j.numero !== dueno)?.numero;
    const rival = rivalNum != null ? bases.get(rivalNum) : undefined;
    if (!propia) return null;

    const dist = (x: number, y: number, p: { x: number; y: number }) =>
      Math.hypot(x - p.x, y - p.y);

    let enCasa = 0, enRival = 0, fuera = 0;
    for (const [, x, y] of vista) {
      if (dist(x, y, propia) <= RADIO_BASE) enCasa += 1;
      else if (rival && dist(x, y, rival) <= RADIO_BASE) enRival += 1;
      else fuera += 1;
    }
    const total = vista.length;

    //  Los empujones del rival dentro de su base, agrupados.
    const ataques: { t: number; x: number; y: number; reaccion: number | null }[] = [];
    let ultimo = -Infinity;
    for (const o of timeline.ejercito) {
      if (o.j === dueno || o.n < UNIDADES_ATAQUE) continue;
      if (dist(o.x, o.y, propia) > RADIO_BASE) continue;
      if (o.t - ultimo < SEPARA_ATAQUES_MS) continue;
      ultimo = o.t;
      //  La primera muestra posterior en la que la camara llega al sitio.
      let reaccion: number | null = null;
      for (const [tv, vx, vy] of vista) {
        if (tv < o.t) continue;
        if (dist(vx, vy, { x: o.x, y: o.y }) <= RADIO_LLEGADA) { reaccion = tv - o.t; break; }
      }
      ataques.push({ t: o.t, x: o.x, y: o.y, reaccion });
    }
    const tiempos = ataques.map((a) => a.reaccion).filter((v): v is number => v != null).sort((a, b) => a - b);
    const mediana = tiempos.length ? tiempos[Math.floor(tiempos.length / 2)] : null;

    return {
      dueno,
      nombre: nombreJ(dueno),
      casa: Math.round((enCasa / total) * 100),
      rival: Math.round((enRival / total) * 100),
      fuera: Math.round((fuera / total) * 100),
      ataques, mediana,
    };
  })();

  const seg = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)}s`
    : `${Math.floor(ms / 60_000)}:${String(Math.round((ms % 60_000) / 1000)).padStart(2, '0')}`);
  const reloj = (ms: number) => `${Math.floor(ms / 60_000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

  if (!series.length) return <p className="text-sm text-gray-500">{t('common.noData')}</p>;

  const techo = Math.max(1, ...series.flatMap((x) => x.serie.map((y) => y[3] ?? 0)));
  const largo = Math.max(...series.map((x) => x.serie.length));

  return (
    <div>
      {/* La atencion. Va primero porque enterarse tarde de un ataque cuesta
          mas que cualquier numero de acciones por minuto. */}
      {ojo && (
        <div className="mb-6">
          <h4 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-1">
            {t('ojo.title', { quien: ojo.nombre })}
          </h4>
          <p className="text-xs text-gray-600 m-0 mb-3">{t('ojo.nota', { quien: ojo.nombre })}</p>

          <div className="flex h-2 rounded-full overflow-hidden mb-2">
            <div style={{ width: `${ojo.casa}%`, background: colorDe(ojo.dueno) }} />
            <div style={{ width: `${ojo.rival}%`, background: 'rgba(255,205,90,0.75)' }} />
            <div style={{ width: `${ojo.fuera}%`, background: 'rgba(255,255,255,0.12)' }} />
          </div>
          <dl className="grid grid-cols-3 gap-2 m-0 mb-5">
            {[
              { et: t('ojo.propia'), v: ojo.casa, c: colorDe(ojo.dueno) },
              { et: t('ojo.rival'), v: ojo.rival, c: 'rgba(255,205,90,0.75)' },
              { et: t('ojo.resto'), v: ojo.fuera, c: 'rgba(255,255,255,0.2)' },
            ].map((x) => (
              <div key={x.et} className="min-w-0">
                {/* Sin truncar: a 390px "The rest of the map" se quedaba en
                    "The rest of the m", que parece un fallo. Mejor dos lineas. */}
                <dt className="flex items-start gap-1.5 text-[11px] text-gray-500 leading-tight">
                  <span className="w-2 h-2 rounded-sm shrink-0 mt-0.5" style={{ background: x.c }} />
                  <span className="min-w-0">{x.et}</span>
                </dt>
                <dd className="m-0 text-lg tabular-nums text-gray-200">{x.v}%</dd>
              </div>
            ))}
          </dl>

          <h5 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-1">
            {t('ojo.reaccion')}
            {ojo.mediana != null && (
              <span className="ml-2 normal-case text-gray-400">
                {t('ojo.mediana', { v: seg(ojo.mediana) })}
              </span>
            )}
          </h5>
          <p className="text-xs text-gray-600 m-0 mb-2">
            {t('ojo.reaccionNota', { quien: ojo.nombre })}
          </p>
          {ojo.ataques.length === 0 ? (
            <p className="text-sm text-gray-500 m-0">{t('ojo.sinAtaques')}</p>
          ) : (
            <ol className="m-0 p-0 list-none flex flex-col gap-1">
              {ojo.ataques.map((a, i) => (
                <li key={i} className="flex items-baseline gap-2 text-sm">
                  <span className="tabular-nums text-gray-500 text-xs w-12 text-right shrink-0">
                    {reloj(a.t)}
                  </span>
                  <span className={`tabular-nums ${
                    a.reaccion == null ? 'text-loss'
                      : a.reaccion < 15_000 ? 'text-win' : 'text-gray-300'
                  }`}>
                    {a.reaccion == null ? t('ojo.nunca') : seg(a.reaccion)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Las posturas. Es una firma de habitos y por eso va al final. */}
      {timeline.posturas && Object.keys(timeline.posturas).length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-1">
            {t('ojo.posturas')}
          </h4>
          <p className="text-xs text-gray-600 m-0 mb-2">{t('ojo.posturasNota')}</p>
          <div className="flex flex-col gap-1">
            {Object.entries(timeline.posturas).map(([num, n]) => (
              <div key={num} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: colorDe(Number(num)) }} />
                  <span className="text-gray-300 truncate">{nombreJ(Number(num))}</span>
                </span>
                <span className="tabular-nums text-gray-200 shrink-0">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <h4 className="text-xs uppercase tracking-wide text-gray-500 m-0 mb-1">{t('apm.title')}</h4>
      <p className="text-xs text-gray-600 m-0 mb-3">{t('apm.note')}</p>

      <div className="flex flex-col gap-3">
        {series.map((s) => (
          <div key={s.numero} className="bg-dark-800/50 border border-dark-500/40 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colorDe(s.numero) }} />
              <span className="text-sm text-gray-200">{nombreJ(s.numero)}</span>
            </div>

            {/* Una frase y no cuatro numeros sueltos: lo que importa es
                cuantas ordenes utiles hizo por minuto, y si eso es mucho o
                poco para su nivel. */}
            <p className="text-[15px] text-gray-200 m-0 mb-1">
              {t('apm.frase', { total: String(s.apm), efectivas: String(s.eapm) })}
            </p>
            <p className="text-xs text-gray-500 m-0 mb-1">
              {t('apm.repetidasFrase', { n: String(s.repetido) })}
            </p>
            {(() => {
              const r = refDeFranja(timeline.jugadores.find((j) => j.numero === s.numero)?.rating);
              if (!r) return null;
              const dif = s.apm - r.apm;
              return (
                <p className="text-xs m-0 mb-3">
                  <span className={dif >= 0 ? 'text-emerald-400/90' : 'text-red-400/90'}>
                    {t(dif >= 0 ? 'apm.masQueFranja' : 'apm.menosQueFranja',
                       { n: String(Math.abs(Math.round(dif))), franja: r.franja, ref: String(Math.round(r.apm)) })}
                  </span>
                </p>
              );
            })()}

            {/* Las efectivas minuto a minuto. */}
            <div className="flex items-end gap-px h-14">
              {Array.from({ length: largo }, (_, m) => {
                const fila = s.serie.find((x) => x[0] === m);
                const v = fila ? (fila[3] ?? 0) : 0;
                return (
                  <div key={m} className="flex-1 h-full flex flex-col justify-end"
                       title={`${m}:00 · ${v}`}>
                    <span className="block w-full rounded-t-[1px]"
                          style={{ height: `${Math.max((v / techo) * 100, v ? 3 : 0)}%`,
                                   background: colorDe(s.numero) }} />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
              <span>0:00</span>
              <span className="text-gray-500">{t('apm.ejeY', { pico: String(s.pico) })}</span>
              <span>{largo}:00</span>
            </div>

            {/* Mandar contra construir. */}
            <div className="mt-2">
              <div className="flex h-1.5 rounded-full overflow-hidden bg-dark-600">
                <span className="bg-gray-500" style={{ width: `${(100 * s.mando) / (s.total || 1)}%` }} />
                <span style={{ width: `${(100 * s.gestion) / (s.total || 1)}%`,
                               background: colorDe(s.numero) }} />
              </div>
              <p className="text-xs text-gray-500 mt-1 m-0">
                {t('apm.repartoFrase', {
                  mando: String(Math.round((100 * s.mando) / (s.total || 1))),
                  gestion: String(Math.round((100 * s.gestion) / (s.total || 1))),
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-gray-600 mt-3 m-0">{t('apm.limite')}</p>
    </div>
  );
}
