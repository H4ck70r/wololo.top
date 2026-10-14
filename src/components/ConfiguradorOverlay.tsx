import { useMemo, useState } from 'react';
import { useT } from '../lib/i18n';

/*
  Arma el enlace del panel en vivo.

  El panel se configura por parametros de la URL -eso no cambia, porque es lo
  que se pega en OBS-, pero escribirlos a mano es pedirle a la gente que se
  aprenda una sintaxis. Esto los escribe por ella y deja el enlace listo para
  copiar; lo que se marca aqui no se guarda en ningun sitio, es el enlace el
  que lleva la configuracion encima.
*/

const PIEZAS = [
  { id: 'civ', k: 'cfg.civ' },
  { id: 'elo', k: 'cfg.elo' },
  { id: 'apm', k: 'cfg.apm' },
  { id: 'units', k: 'cfg.units' },
  { id: 'reference', k: 'cfg.ref' },
  { id: 'opponent', k: 'cfg.rival' },
] as const;

export default function ConfiguradorOverlay({
  profileId,
  token,
}: {
  profileId: number | null;
  token: string | null;
}) {
  const { t } = useT();
  const [visibles, setVisibles] = useState<Set<string>>(new Set(PIEZAS.map((p) => p.id)));
  const [titulo, setTitulo] = useState('');
  const [marcador, setMarcador] = useState('');
  const [obs, setObs] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const enlace = useMemo(() => {
    const base = `${window.location.origin}/live/${profileId ?? 'TU_ID'}`;
    const p = new URLSearchParams();
    p.set('t', token || 'TU_TOKEN');
    const ocultas = PIEZAS.filter((x) => !visibles.has(x.id)).map((x) => x.id);
    if (ocultas.length) p.set('hide', ocultas.join(','));
    if (titulo.trim()) p.set('title', titulo.trim());
    if (marcador.trim()) p.set('score', marcador.trim());
    if (obs) p.set('bg', 'none');
    //  Sin codificar las comas ni los espacios: es un enlace para leerlo y
    //  pegarlo, y el navegador los entiende igual.
    return `${base}?${p.toString().replace(/%2C/g, ',').replace(/\+/g, '%20')}`;
  }, [profileId, token, visibles, titulo, marcador, obs]);

  const alternar = (id: string) =>
    setVisibles((v) => {
      const n = new Set(v);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sin portapapeles: el enlace esta a la vista para seleccionarlo */
    }
  };

  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900/50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-stone-500">{t('cfg.title')}</span>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="NACHO vs RIVALES"
            className="mt-1 w-full rounded border border-stone-700 bg-stone-950 px-2 py-1 text-sm text-stone-100 placeholder:text-stone-600 focus:border-stone-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs text-stone-500">{t('cfg.score')}</span>
          <input
            value={marcador}
            onChange={(e) => setMarcador(e.target.value)}
            placeholder="5-2"
            className="mt-1 w-full rounded border border-stone-700 bg-stone-950 px-2 py-1 text-sm text-stone-100 placeholder:text-stone-600 focus:border-stone-500 focus:outline-none"
          />
        </label>
      </div>

      <p className="mt-4 text-xs text-stone-500">{t('cfg.show')}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {PIEZAS.map((p) => {
          const on = visibles.has(p.id);
          return (
            <button
              key={p.id}
              onClick={() => alternar(p.id)}
              aria-pressed={on}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                on
                  ? 'border-gold-500/60 bg-gold-500/15 text-gold-300'
                  : 'border-stone-700 text-stone-500 hover:border-stone-600'
              }`}
            >
              {t(p.k as never)}
            </button>
          );
        })}
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-stone-300">
        <input
          type="checkbox"
          checked={obs}
          onChange={(e) => setObs(e.target.checked)}
          className="accent-gold-500"
        />
        {t('cfg.obs')}
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={copiar}
          className="rounded-lg bg-gold-500 px-3 py-1.5 text-sm font-medium text-stone-950 hover:bg-gold-400"
        >
          {copiado ? t('cfg.copied') : t('cfg.copy')}
        </button>
        <a
          href={enlace}
          target="_blank"
          rel="noopener"
          className="rounded-lg border border-stone-700 px-3 py-1.5 text-sm text-stone-200 hover:border-stone-500"
        >
          {t('cfg.open')}
        </a>
      </div>
      <pre className="mt-3 overflow-x-auto rounded bg-stone-950 p-2 font-mono text-[11px] leading-relaxed text-stone-400">
        {enlace}
      </pre>
      {!token && <p className="mt-2 text-xs text-stone-500">{t('cfg.needKey')}</p>}
    </div>
  );
}
