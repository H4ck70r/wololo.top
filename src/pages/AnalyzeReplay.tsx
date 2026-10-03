import { useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { analyzeReplays } from '../lib/api';
import { useT } from '../lib/i18n';
import ReplayMap from '../components/ReplayMap';
import type { ReplayUploadResult } from '../lib/types';

const reloj = (ms: number | null | undefined) => {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

//  Lo que hay que sumar al clic para saber cuándo CAE la edad. Es lo que usan
//  las guías, así que es lo que se enseña.
const INVESTIGACION_MS = { feudal: 130_000, castle: 160_000 };

/**
 * Subir una partida y verla.
 *
 * El mapa es gratis y compartible a propósito: es lo que trae gente. Lo que no
 * se puede sacar de un fichero es la comparación contra cuarenta mil partidas,
 * y eso vive en el perfil.
 */
export default function AnalyzeReplay() {
  const { t } = useT();
  const entrada = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<ReplayUploadResult[]>([]);
  const [encima, setEncima] = useState(false);

  async function subir(ficheros: FileList | File[] | null) {
    const lista = Array.from(ficheros ?? []);
    if (!lista.length) return;
    setCargando(true);
    setError(null);
    try {
      const r = await analyzeReplays(lista);
      setResultados(r.results);
    } catch (e) {
      const bruto = e instanceof Error ? e.message : String(e);
      const grande = lista.reduce((n, f) => n + f.size, 0);
      //  fetch lanza TypeError sin detalle cuando la respuesta no trae CORS,
      //  que es exactamente lo que pasa cuando un proxy corta por tamano. Un
      //  "Failed to fetch" a secas no le dice nada a nadie.
      setError(
        /failed to fetch|networkerror|load failed/i.test(bruto)
          ? t('up.errNetwork', { mb: (grande / 1048576).toFixed(1) })
          : bruto
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Helmet>
        <title>{t('up.title')} · wololo.top</title>
      </Helmet>

      <h1 className="text-2xl font-semibold text-gray-100 m-0 mb-1">{t('up.title')}</h1>
      <p className="text-sm text-gray-400 m-0 mb-5">{t('up.intro')}</p>

      {resultados.length === 0 && (
        <>
          <div
            onClick={() => entrada.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setEncima(true); }}
            onDragLeave={() => setEncima(false)}
            onDrop={(e) => { e.preventDefault(); setEncima(false); subir(e.dataTransfer.files); }}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              encima ? 'border-gold-400 bg-gold-500/5' : 'border-dark-400 hover:border-dark-300'
            }`}
          >
            <p className="text-sm text-gray-300 m-0">
              {cargando ? t('up.analysing') : t('up.drop')}
            </p>
          </div>

          {/* La ruta es larga y distinta en cada sistema: plegada, y en bloque
              de codigo para que se pueda copiar de un tiron. */}
          <details className="mt-3 group">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300 list-none">
              {t('up.whereTitle')}
            </summary>
            <div className="mt-2 flex flex-col gap-2">
              <div>
                <p className="text-[11px] text-gray-500 m-0 mb-1">Windows</p>
                <code className="block text-[11px] text-gray-400 bg-dark-800 border border-dark-500 rounded px-2 py-1.5 overflow-x-auto whitespace-pre">
                  Documentos\My Games\Age of Empires 2 DE\&lt;steam id&gt;\SaveGame
                </code>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 m-0 mb-1">Linux · Steam Deck</p>
                <code className="block text-[11px] text-gray-400 bg-dark-800 border border-dark-500 rounded px-2 py-1.5 overflow-x-auto whitespace-pre">
                  ~/.local/share/Steam/steamapps/compatdata/813780/pfx/drive_c/users/steamuser/Games/Age of Empires 2 DE/&lt;steam id&gt;/savegame
                </code>
                <p className="text-[11px] text-gray-600 m-0 mt-1">{t('up.whereLinux')}</p>
              </div>
            </div>
          </details>
          <input
            ref={entrada}
            type="file"
            accept=".aoe2record,.aoe2mpgame,.mgz"
            multiple
            className="hidden"
            onChange={(e) => subir(e.target.files)}
          />
          <p className="text-[11px] text-gray-600 mt-3 m-0">{t('up.privacy')}</p>
        </>
      )}

      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2 mt-4">
          {error}
        </p>
      )}

      {resultados.map((r, i) => (
        <div key={i} className="bg-dark-700 border border-dark-400 rounded-xl p-4 mt-4">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <span className="text-sm font-medium text-gray-200">{r.file}</span>
            {r.matched && r.match_id && (
              <a href={`/match/${r.match_id}`} className="text-xs text-gold-400 hover:underline">
                {t('up.matched', { id: String(r.match_id) })}
              </a>
            )}
          </div>

          {!r.ok ? (
            <p className="text-sm text-red-300 m-0 mt-2">{t('up.failed')}: {r.error}</p>
          ) : (
            <>
              <p className="text-[11px] text-gray-500 m-0 mt-1">
                {!r.matched && t('up.unmatched')}
                {r.matched && r.already_analyzed && !r.stored && t('up.already')}
                {r.stored && t('up.stored')}
              </p>

              <div className="mt-3 -mx-4 px-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-400 text-gray-500">
                      <th className="text-left py-2 pr-3 font-medium">·</th>
                      <th className="text-left py-2 px-2 font-medium">{t('up.opening')}</th>
                      <th className="text-right py-2 px-2 font-medium">{t('up.feudal')}</th>
                      <th className="text-right py-2 px-2 font-medium">{t('up.castle')}</th>
                      <th className="text-right py-2 px-2 font-medium">{t('up.vils')}</th>
                      <th className="text-right py-2 pl-2 font-medium">{t('up.apm')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(r.players as Record<string, number | string | null>[]).map((p, k) => {
                      const nombre = r.info?.jugadores?.find(
                        (j) => j.perfil === p.profile_id
                      )?.nombre;
                      const f = p.feudal_ms as number | null;
                      const c = p.castle_ms as number | null;
                      return (
                        <tr key={k} className="border-b border-dark-500/40">
                          <td className="py-2 pr-3 text-gray-300">{nombre ?? p.profile_id}</td>
                          <td className="py-2 px-2 text-gray-300">{(p.opening as string) ?? '—'}</td>
                          {/* En aterrizaje, no en el clic: es lo que dicen las guías. */}
                          <td className="py-2 px-2 text-right tabular-nums text-gray-300">
                            {f == null ? '—' : reloj(f + INVESTIGACION_MS.feudal)}
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums text-gray-300">
                            {c == null ? '—' : reloj(c + INVESTIGACION_MS.castle)}
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums text-gray-300">
                            {(p.villagers_15m as number) ?? '—'}
                          </td>
                          <td className="py-2 pl-2 text-right tabular-nums text-gray-300">
                            {(p.apm as number) ?? '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {r.timeline && (
                <div className="mt-5">
                  <ReplayMap timeline={r.timeline} />
                </div>
              )}
              {r.timeline_error && (
                <p className="text-[11px] text-gray-600 mt-2 m-0">{r.timeline_error}</p>
              )}
            </>
          )}
        </div>
      ))}

      {resultados.length > 0 && (
        <button
          onClick={() => { setResultados([]); setError(null); }}
          className="mt-4 px-3 py-1.5 text-sm rounded-lg border border-dark-400 text-gray-300 hover:bg-dark-600"
        >
          {t('up.again')}
        </button>
      )}
    </div>
  );
}
