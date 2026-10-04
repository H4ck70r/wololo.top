import { useQuery } from '@tanstack/react-query';
import { getLevelBenchmarks } from '../lib/api';
import { useT } from '../lib/i18n';
import { useSession } from '../lib/session';
import type { LevelBenchmarksResponse, LevelBenchmark } from '../lib/types';

interface Props {
  matchType: string;
  /** rating del visitante, para resaltar su propio escalón */
  rating?: number;
}

const reloj = (s: number | null) =>
  s == null ? null : `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** De '1000-1200' al par de números, para saber en qué fila cae el visitante. */
function limites(bracket: string): [number, number] {
  if (bracket.startsWith('<')) return [0, parseInt(bracket.slice(1))];
  if (bracket.endsWith('+')) return [parseInt(bracket), Infinity];
  const [a, b] = bracket.split('-').map((x) => parseInt(x));
  return [a, b];
}

/**
 * Qué hace distinto el que está por encima. No dice qué hacer: dice qué hacen,
 * que es lo único que los datos pueden sostener.
 */
export default function LevelBenchmarks({ matchType, rating }: Props) {
  const { t } = useT();
  const { user } = useSession();

  const { data, isLoading } = useQuery<LevelBenchmarksResponse>({
    queryKey: ['levelBenchmarks', matchType],
    queryFn: () => getLevelBenchmarks({ match_type: matchType }),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return <p className="text-sm text-gray-500">{t('common.loading')}…</p>;
  if (!data?.brackets?.length) return <p className="text-sm text-gray-500">{t('common.noData')}</p>;

  const columnas: { clave: keyof LevelBenchmark; etiqueta: string; fmt: (b: LevelBenchmark) => string | null }[] = [
    { clave: 'feudal_s', etiqueta: t('bench.feudal'), fmt: (b) => reloj(b.feudal_s) },
    { clave: 'castle_s', etiqueta: t('bench.castle'), fmt: (b) => reloj(b.castle_s) },
    { clave: 'villagers_15m', etiqueta: t('bench.villagers'), fmt: (b) => b.villagers_15m?.toFixed(1) ?? null },
    { clave: 'tc_idle_s', etiqueta: t('bench.tcIdle'), fmt: (b) => (b.tc_idle_s == null ? null : `${b.tc_idle_s}s`) },
    { clave: 'apm', etiqueta: t('bench.apm'), fmt: (b) => b.apm?.toFixed(0) ?? null },
  ];

  return (
    <div>
      <p className="text-sm text-gray-400 m-0 mb-1">{t('bench.intro')}</p>
      <p className="text-xs text-gray-600 m-0 mb-4">
        {t('bench.sample', { n: data.total_samples.toLocaleString() })}
      </p>

      {/* Siete columnas no caben en un movil ni arrastrando: ahi cada franja
          es una tarjeta con sus cinco numeros. La tabla se queda de sm hacia
          arriba, que es donde sabe leerse de un vistazo. */}
      <div className="sm:hidden flex flex-col gap-2">
        {data.brackets.map((b) => {
          const [lo, hi] = limites(b.bracket);
          const mio = rating != null && rating >= lo && rating < hi;
          return (
            <div
              key={b.bracket}
              className={`rounded-xl border p-3 ${
                mio ? 'border-gold-500/40 bg-gold-500/10' : 'border-dark-400 bg-dark-700'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className={`font-medium ${mio ? 'text-gold-400' : 'text-gray-200'}`}>
                  {b.bracket}
                  {mio && <span className="ml-2 text-[10px] text-gold-400/80">{t('bench.you')}</span>}
                </span>
                <span className="text-[11px] text-gray-500 tabular-nums shrink-0">
                  {t('bench.games', { n: b.samples.toLocaleString() })}
                  {b.thin && <span className="ml-1 text-gray-600">{t('bench.thin')}</span>}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 m-0">
                {columnas.map((c) => (
                  <div key={String(c.clave)} className="flex items-baseline justify-between gap-2 min-w-0">
                    <dt className="text-xs text-gray-500 truncate">{c.etiqueta}</dt>
                    <dd className="text-sm tabular-nums text-gray-200 m-0 shrink-0">
                      {c.fmt(b) ?? <span className="text-gray-600">—</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      <div className="hidden sm:block bg-dark-700 border border-dark-400 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-400 bg-dark-800/50">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">{t('bench.bracket')}</th>
              {columnas.map((c) => (
                <th key={String(c.clave)} className="text-right py-3 px-3 text-gray-400 font-medium whitespace-nowrap">
                  {c.etiqueta}
                </th>
              ))}
              <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('common.games')}</th>
            </tr>
          </thead>
          <tbody>
            {data.brackets.map((b) => {
              const [lo, hi] = limites(b.bracket);
              const mio = rating != null && rating >= lo && rating < hi;
              return (
                <tr key={b.bracket} className={`border-b border-dark-500/40 ${
                  mio ? 'bg-gold-500/10' : ''
                }`}>
                  <td className="py-2.5 px-4 font-medium">
                    <span className={mio ? 'text-gold-400' : 'text-gray-200'}>{b.bracket}</span>
                    {mio && <span className="ml-2 text-[10px] text-gold-400/80">{t('bench.you')}</span>}
                  </td>
                  {columnas.map((c) => (
                    <td key={String(c.clave)} className="py-2.5 px-3 text-right tabular-nums text-gray-300">
                      {c.fmt(b) ?? <span className="text-gray-600">—</span>}
                    </td>
                  ))}
                  <td className="py-2.5 px-4 text-right tabular-nums text-xs text-gray-500">
                    {b.samples.toLocaleString()}
                    {/* Un promedio sin su muestra no es una referencia. */}
                    {b.thin && <span className="ml-1 text-gray-600">{t('bench.thin')}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-600 mt-3 m-0">{t('bench.footnote')}</p>
      {!user && <p className="text-[11px] text-gray-600 mt-1 m-0">{t('bench.signInHint')}</p>}
    </div>
  );
}
