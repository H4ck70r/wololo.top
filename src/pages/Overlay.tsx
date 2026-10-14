import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../lib/i18n';
import { authFetch, useSession } from '../lib/session';
import ConfiguradorOverlay from '../components/ConfiguradorOverlay';

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

/**
 * La clave con la que el vigilante publica.
 *
 * El servidor guarda el hash, asi que se enseña una vez y ya: en vez de dejar
 * el secreto suelto para que cada uno vea donde lo pega, se enseña la orden
 * entera, que es lo que de verdad hace falta.
 */
function Clave() {
  const { t } = useT();
  const { user, signIn } = useSession();
  const [clave, setClave] = useState<string | null>(null);
  const [pidiendo, setPidiendo] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);

  if (!user) {
    return (
      <button onClick={signIn} className="rounded-lg border border-stone-700 px-4 py-2 text-sm text-stone-200 hover:border-stone-500">
        {t('ovp.signIn')}
      </button>
    );
  }
  if (!user.profile_id) {
    return (
      <p className="text-sm text-stone-400">
        {t('ovp.needClaim')}{' '}
        <Link to="/auth/claim" className="text-gold-400 hover:underline">
          {t('ovp.claimLink')}
        </Link>
      </p>
    );
  }

  const generar = async () => {
    setPidiendo(true);
    setFallo(null);
    try {
      const r = await authFetch('/api/overlay/clave', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.message || String(r.status));
      setClave(d.key);
    } catch (e) {
      setFallo(e instanceof Error ? e.message : String(e));
    } finally {
      setPidiendo(false);
    }
  };

  return (
    <div>
      <button
        onClick={generar}
        disabled={pidiendo}
        className="rounded-lg border border-stone-700 px-4 py-2 text-sm text-stone-200 hover:border-stone-500 disabled:opacity-50"
      >
        {clave ? t('ovp.keyAgain') : t('ovp.keyGet')}
      </button>
      {fallo && <p className="mt-2 text-sm text-red-400">{fallo}</p>}
      {clave && (
        <>
          <pre className="mt-3 overflow-x-auto rounded bg-stone-900 p-2 font-mono text-xs text-stone-300">
            wololo-vivo --publish --key {clave}
          </pre>
          <p className="mt-2 text-xs text-stone-500">{t('ovp.keyOnce')}</p>
        </>
      )}
    </div>
  );
}

/** Trae de la sesion el perfil y el token del enlace, y monta el configurador. */
function Configurador() {
  const { user } = useSession();
  const [datos, setDatos] = useState<{ profile_id: number | null; live_token: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    let vivo = true;
    authFetch('/api/overlay/clave')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vivo && d) setDatos({ profile_id: d.profile_id, live_token: d.live_token });
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [user]);

  return (
    <ConfiguradorOverlay
      profileId={datos?.profile_id ?? user?.profile_id ?? null}
      token={datos?.live_token ?? null}
    />
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

      <h2 className="mt-8 text-lg font-medium text-stone-100">{t('ovp.keyTitle')}</h2>
      <p className="mb-3 mt-2 text-sm text-stone-400">{t('ovp.keyBody')}</p>
      <Clave />

      <h2 className="mt-8 text-lg font-medium text-stone-100">{t('ovp.winTitle')}</h2>
      <p className="mt-2 text-sm text-stone-400">{t('ovp.winBody')}</p>
      {/*
        La orden entera y no solo la bandera: sin --publicar no sube nada a la
        web, y sin la clave no hay comparacion contra la franja. Enseñar
        'wololo-vivo --ventana' a secas mandaba a la gente a un panel mudo.
      */}
      <pre className="mt-2 overflow-x-auto rounded bg-stone-900 p-2 font-mono text-xs text-stone-300">
        wololo-vivo --window --compact --publish --key YOUR_KEY
      </pre>
      <p className="mt-2 text-xs text-stone-500">{t('ovp.winFlags')}</p>

      <h2 className="mt-8 text-lg font-medium text-stone-100">{t('ovp.cfgTitle')}</h2>
      <p className="mb-3 mt-2 text-sm text-stone-400">{t('ovp.cfgBody')}</p>
      <Configurador />

      <h2 className="mt-8 text-lg font-medium text-stone-100">{t('ovp.fairTitle')}</h2>
      <p className="mt-2 text-sm text-stone-400">{t('ovp.fairBody')}</p>

      <h2 className="mt-8 text-lg font-medium text-stone-100">{t('ovp.whatTitle')}</h2>
      <p className="mt-2 text-sm text-stone-400">{t('ovp.whatBody')}</p>
    </div>
  );
}
