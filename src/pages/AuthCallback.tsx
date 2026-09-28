import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSession } from '../lib/session';
import { useT } from '../lib/i18n';

/**
 * Where Steam drops the visitor back. The URL carries a one-time code, never
 * the session token, so nothing usable is left behind in the address bar or
 * in history.
 */
export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeCode, user } = useSession();
  const { t } = useT();
  const [error, setError] = useState<string | null>(params.get('error'));
  // React 19 runs effects twice in development, and the code only works once.
  const started = useRef(false);

  useEffect(() => {
    const code = params.get('code');
    if (!code || started.current) return;
    started.current = true;
    exchangeCode(code).catch(() => setError('exchange_failed'));
  }, [params, exchangeCode]);

  // The redirect waits for the session rather than for the exchange, so it
  // also covers someone landing here while already signed in. Replacing the
  // entry keeps a spent code out of the back button.
  useEffect(() => {
    if (!user) return;
    navigate(user.needs_profile ? '/auth/claim' : `/player/${user.profile_id}`, { replace: true });
  }, [user, navigate]);

  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <Helmet><title>{t('auth.signingIn')} - wololo.top</title></Helmet>
      {error ? (
        <>
          <p className="text-gray-300 m-0 mb-3">{t('auth.failed')}</p>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="px-3 py-2 rounded-lg text-sm border border-dark-400 text-gray-300 bg-transparent cursor-pointer"
          >
            {t('notFound.goHome')}
          </button>
        </>
      ) : (
        <>
          <div className="w-8 h-8 mx-auto mb-3 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 m-0">{t('auth.signingIn')}</p>
        </>
      )}
    </div>
  );
}
