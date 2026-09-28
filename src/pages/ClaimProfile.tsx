import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PlayerSearchInput from '../components/PlayerSearchInput';
import { useSession } from '../lib/session';
import { useT } from '../lib/i18n';
import { countryFlag } from '../lib/constants';
import type { PlayerSearchResult } from '../lib/types';

/**
 * The fallback for Steam accounts that steam_profiles has never seen. Picking
 * a profile here is a statement, not proof, so the only rule enforced is that
 * two accounts cannot hold the same profile.
 */
export default function ClaimProfile() {
  const { user, claimProfile } = useSession();
  const { t } = useT();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<PlayerSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    if (!picked) return;
    setSaving(true);
    setError(null);
    try {
      await claimProfile(picked.profile_id);
      navigate(`/player/${picked.profile_id}`, { replace: true });
    } catch (e) {
      setError((e as Error).message === 'already_claimed' ? t('auth.claimTaken') : t('auth.claimFailed'));
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10">
      <Helmet><title>{t('auth.claimTitle')} - wololo.top</title></Helmet>
      <h1 className="text-2xl font-bold text-gray-100 m-0 mb-2">{t('auth.claimTitle')}</h1>
      <p className="text-sm text-gray-400 m-0 mb-5">{t('auth.claimBody')}</p>

      <PlayerSearchInput onSelect={setPicked} placeholder={t('auth.claimSearch')} />

      {picked && (
        <div className="mt-5 bg-dark-700 border border-dark-400 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span>{countryFlag(picked.country)}</span>
            <span className="text-gray-100 font-semibold">{picked.alias}</span>
            <span className="ml-auto text-xs text-gray-500 tabular-nums">#{picked.profile_id}</span>
          </div>
          {error && <p className="text-sm text-red-400 m-0 mb-3">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirm}
              disabled={saving}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-gold-500/15 text-gold-400 border border-gold-500/40 cursor-pointer disabled:opacity-50"
            >
              {saving ? `${t('common.loading')}…` : t('auth.claimButton')}
            </button>
            <button
              type="button"
              onClick={() => { setPicked(null); setError(null); }}
              className="px-3 py-2 rounded-lg text-sm text-gray-400 border border-dark-400 bg-transparent cursor-pointer"
            >
              {t('auth.claimCancel')}
            </button>
          </div>
        </div>
      )}

      {user && !user.needs_profile && (
        <p className="text-xs text-gray-600 mt-6 m-0">{t('auth.claimAlready')}</p>
      )}
    </div>
  );
}
