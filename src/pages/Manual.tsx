import { Link } from 'react-router-dom';
import { useT } from '../lib/i18n';

/*
  El manual, escrito para quien va a usar la herramienta.

  Vive aqui y no en un documento aparte porque el que se baja el programa llega
  a wololo.top, no a otro sitio: un manual al que hay que pasarle el enlace es
  un manual que nadie encuentra.

  Lo que NO lleva: nada de como esta hecho por dentro. Al que juega no le
  importa el formato del replay ni cada cuanto se relee; le importa que abra,
  que vea y que sepa que significa lo que ve.
*/

//  La version en la URL: si una captura se rehace, el que ya visito la pagina
//  seguiria viendo la vieja de su cache. Se sube el numero y se acabo.
const IMG = '/imagenes/manual';
const V = '?v=4';

function Paso({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gold-500 font-mono text-sm font-semibold text-stone-950">
        {n}
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="font-medium text-stone-100">{titulo}</p>
        <div className="mt-1 text-sm text-stone-400">{children}</div>
      </div>
    </li>
  );
}

/**
 * Una captura a su tamaño real.
 *
 * Estaban a lo ancho de la columna, asi que un panel de 237 pixeles se veia a
 * casi el triple: borroso y, peor, mintiendo sobre lo que ocupa en pantalla.
 * El que mira el manual esta decidiendo si le cabe encima del juego, asi que
 * la captura tiene que medir lo que medira. Solo encoge si no cabe.
 */
function Pantalla({
  src,
  alt,
  ancho,
  pie,
}: {
  src: string;
  alt: string;
  ancho: number;
  pie: string;
}) {
  return (
    <figure className="mt-4">
      <img
        src={src}
        alt={alt}
        width={ancho}
        loading="lazy"
        className="h-auto max-w-full rounded border border-stone-800"
        style={{ width: ancho }}
      />
      <figcaption className="mt-2 text-xs text-stone-500">{pie}</figcaption>
    </figure>
  );
}

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-stone-800 pt-10">
      <h2 className="text-xl font-semibold text-stone-100">{titulo}</h2>
      <div className="mt-3 space-y-3 text-stone-300">{children}</div>
    </section>
  );
}

export default function Manual() {
  const { t } = useT();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-100">{t('man.title')}</h1>
      <p className="mt-2 text-stone-400">{t('man.lead')}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to="/overlay"
          className="rounded-lg bg-gold-500 px-4 py-2 font-medium text-stone-950 hover:bg-gold-400"
        >
          {t('man.download')}
        </Link>
      </div>

      <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
        <a href="#ves" className="hover:text-gold-400">{t('man.navSee')}</a>
        <a href="#empezar" className="hover:text-gold-400">{t('man.navStart')}</a>
        <a href="#numeros" className="hover:text-gold-400">{t('man.navNumbers')}</a>
        <a href="#stream" className="hover:text-gold-400">{t('man.navStream')}</a>
        <a href="#problemas" className="hover:text-gold-400">{t('man.navHelp')}</a>
      </nav>

      <div className="mt-10 space-y-10">
        <Seccion id="ves" titulo={t('man.seeTitle')}>
          <p>{t('man.seeBody')}</p>
          <Pantalla src={`${IMG}/tira.png${V}`} ancho={335} alt={t('man.stripAlt')} pie={t('man.stripCaption')} />
          <Pantalla src={`${IMG}/panel.png${V}`} ancho={237} alt={t('man.panelAlt')} pie={t('man.panelCaption')} />
        </Seccion>

        <Seccion id="empezar" titulo={t('man.startTitle')}>
          <ol className="space-y-5">
            <Paso n={1} titulo={t('man.s1')}>{t('man.s1b')}</Paso>
            <Paso n={2} titulo={t('man.s2')}>{t('man.s2b')}</Paso>
            <Paso n={3} titulo={t('man.s3')}>{t('man.s3b')}</Paso>
          </ol>
          <div className="mt-6 rounded-lg border border-stone-800 bg-stone-900/50 p-4">
            <p className="text-sm font-medium text-stone-200">{t('man.modesTitle')}</p>
            <div className="mt-3 space-y-3">
              <div>
                <p className="font-mono text-xs text-emerald-300">wololo-live --window --compact</p>
                <p className="mt-1 text-sm text-stone-400">{t('man.modeCompact')}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-emerald-300">wololo-live --window</p>
                <p className="mt-1 text-sm text-stone-400">{t('man.modeFull')}</p>
              </div>
              <div>
                <p className="font-mono text-xs text-emerald-300">wololo-live</p>
                <p className="mt-1 text-sm text-stone-400">{t('man.modeConsole')}</p>
              </div>
            </div>
          </div>
        </Seccion>

        <Seccion id="numeros" titulo={t('man.numTitle')}>
          <p>{t('man.numLead')}</p>
          <dl className="mt-4 space-y-3">
            {[
              ['man.nOpening', 'man.nOpeningB'],
              ['man.nFeudal', 'man.nFeudalB'],
              ['man.nCastle', 'man.nCastleB'],
              ['man.nImperial', 'man.nImperialB'],
              ['man.nVills', 'man.nVillsB'],
              ['man.nIdle', 'man.nIdleB'],
              ['man.nApm', 'man.nApmB'],
            ].map(([k, b]) => (
              <div key={k} className="flex flex-col gap-0.5 border-l-2 border-stone-800 pl-4">
                <dt className="font-medium text-stone-200">{t(k as never)}</dt>
                <dd className="text-sm text-stone-400">{t(b as never)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 rounded-lg border border-gold-500/30 bg-gold-500/5 p-4">
            <p className="text-sm font-medium text-gold-300">{t('man.vsTitle')}</p>
            <p className="mt-1 text-sm text-stone-300">{t('man.vsBody')}</p>
          </div>
        </Seccion>

        <Seccion id="stream" titulo={t('man.streamTitle')}>
          <p>{t('man.streamLead')}</p>
          <Pantalla src={`${IMG}/vivo.png${V}`} ancho={320} alt={t('man.liveAlt')} pie={t('man.liveCaption')} />
          <ol className="mt-4 space-y-5">
            <Paso n={1} titulo={t('man.o1')}>{t('man.o1b')}</Paso>
            <Paso n={2} titulo={t('man.o2')}>{t('man.o2b')}</Paso>
            <Paso n={3} titulo={t('man.o3')}>{t('man.o3b')}</Paso>
          </ol>
          <Pantalla src={`${IMG}/configurador.png${V}`} ancho={482} alt={t('man.cfgAlt')} pie={t('man.cfgCaption')} />
        </Seccion>

        <Seccion id="problemas" titulo={t('man.helpTitle')}>
          <dl className="space-y-4">
            {[
              ['man.p1', 'man.p1b'],
              ['man.p2', 'man.p2b'],
              ['man.p3', 'man.p3b'],
              ['man.p4', 'man.p4b'],
              ['man.p5', 'man.p5b'],
              ['man.p6', 'man.p6b'],
            ].map(([k, b]) => (
              <div key={k}>
                <dt className="font-medium text-stone-200">{t(k as never)}</dt>
                <dd className="mt-1 text-sm text-stone-400">{t(b as never)}</dd>
              </div>
            ))}
          </dl>
        </Seccion>
      </div>

      <p className="mt-12 text-sm text-stone-500">
        {t('man.foot')}{' '}
        <Link to="/overlay" className="text-gold-400 hover:underline">
          {t('man.footLink')}
        </Link>
      </p>
    </div>
  );
}
