import { useT } from '../lib/i18n';

const DESCARGAS = {
  windows: '/descargas/wololo-vivo-windows.exe',
  linux: '/descargas/wololo-vivo-linux',
};

function Paso({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-stone-800 font-mono text-xs text-gold-400">
        {n}
      </span>
      <div className="min-w-0">
        <p className="font-medium text-stone-100">{titulo}</p>
        <div className="mt-1 text-sm text-stone-400">{children}</div>
      </div>
    </li>
  );
}

export default function Overlay() {
  const { t } = useT();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-stone-100">{t('ovp.title')}</h1>
      <p className="mt-2 text-stone-400">{t('ovp.lead')}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={DESCARGAS.windows}
          className="rounded-lg bg-gold-500 px-4 py-2 font-medium text-stone-950 hover:bg-gold-400"
        >
          {t('ovp.dlWindows')}
        </a>
        <a
          href={DESCARGAS.linux}
          className="rounded-lg border border-stone-700 px-4 py-2 font-medium text-stone-200 hover:border-stone-500"
        >
          {t('ovp.dlLinux')}
        </a>
      </div>
      {/*
        Dicho antes de que lo descubra solo delante del aviso de Windows: el
        ejecutable no esta firmado, y un certificado cuesta dinero todos los
        años. Mejor avisar que parecer sospechoso.
      */}
      <p className="mt-3 text-xs text-stone-500">{t('ovp.unsigned')}</p>

      <h2 className="mt-8 text-lg font-medium text-stone-100">{t('ovp.howTitle')}</h2>
      <ol className="mt-3 space-y-4">
        <Paso n={1} titulo={t('ovp.s1')}>
          {t('ovp.s1body')}
        </Paso>
        <Paso n={2} titulo={t('ovp.s2')}>
          {t('ovp.s2body')}
        </Paso>
        <Paso n={3} titulo={t('ovp.s3')}>
          {t('ovp.s3body')}
          <pre className="mt-2 overflow-x-auto rounded bg-stone-900 p-2 font-mono text-xs text-stone-300">
            https://wololo.top/live/TU_ID?t=TU_TOKEN&amp;bg=none
          </pre>
          {/*
            El binario enseña las cifras en consola sin cuenta ninguna; lo que
            necesita clave es publicarlas como pagina, y hoy las claves las
            damos a mano. Decirlo aqui y no dejar que lo descubra fallando.
          */}
          <p className="mt-2 text-xs text-stone-500">{t('ovp.s3key')}</p>
        </Paso>
      </ol>

      <h2 className="mt-8 text-lg font-medium text-stone-100">{t('ovp.winTitle')}</h2>
      <p className="mt-2 text-sm text-stone-400">{t('ovp.winBody')}</p>
      <pre className="mt-2 overflow-x-auto rounded bg-stone-900 p-2 font-mono text-xs text-stone-300">
        wololo-vivo --ventana
      </pre>

      <h2 className="mt-8 text-lg font-medium text-stone-100">{t('ovp.fairTitle')}</h2>
      <p className="mt-2 text-sm text-stone-400">{t('ovp.fairBody')}</p>

      <h2 className="mt-8 text-lg font-medium text-stone-100">{t('ovp.whatTitle')}</h2>
      <p className="mt-2 text-sm text-stone-400">{t('ovp.whatBody')}</p>
    </div>
  );
}
