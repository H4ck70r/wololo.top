import { Link } from 'react-router-dom';
import { useT } from '../lib/i18n';
import type { SessionUser } from '../lib/session';

interface Props {
  user: SessionUser | null;
  loading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onNavigate?: () => void;
  /** stacked full-width variant for the mobile drawer */
  block?: boolean;
}

/**
 * Sign-in lives in the header because it answers one question everywhere on
 * the site: which of these profiles is yours.
 */
export default function SteamButton({ user, loading, onSignIn, onSignOut, onNavigate, block }: Props) {
  const { t } = useT();

  // No placeholder while the session is being checked: a button that appears
  // and is then replaced reads as a glitch.
  if (loading) return null;

  if (!user) {
    return (
      <button
        type="button"
        onClick={onSignIn}
        className={`flex items-center gap-1.5 rounded-lg text-sm font-medium text-gray-300 border border-dark-400 bg-transparent hover:text-gold-400 hover:border-gray-500 transition-colors cursor-pointer ${
          block ? 'w-full justify-center px-3 py-2.5' : 'px-2.5 py-1.5'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.6 2 2.2 6.1 2 11.4l5.4 2.2a3 3 0 0 1 1.7-.5l2.4-3.5v-.1a4 4 0 1 1 4 4h-.1l-3.4 2.5a3 3 0 0 1-6-.2l-3.8-1.6A10 10 0 1 0 12 2Zm-3.3 15.2 1.2.5a2.3 2.3 0 1 0 1.3-3l1.3.5a1.7 1.7 0 1 1-1.3 3.1l-2.5-1.1Zm6.8-4a2.7 2.7 0 1 0 0-5.3 2.7 2.7 0 0 0 0 5.3Zm0-4.6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
        </svg>
        {t('auth.signIn')}
      </button>
    );
  }

  const target = user.needs_profile ? '/auth/claim' : `/player/${user.profile_id}`;

  return (
    <div className={`flex items-center gap-2 ${block ? 'px-3 py-1' : ''}`}>
      <Link
        to={target}
        onClick={onNavigate}
        className="flex items-center gap-2 no-underline text-sm text-gray-300 hover:text-gold-400 min-w-0"
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" className="w-6 h-6 rounded-full shrink-0" />
        ) : (
          <span className="w-6 h-6 rounded-full bg-dark-500 shrink-0" />
        )}
        <span className="truncate max-w-[9rem]">{user.alias || t('auth.myProfile')}</span>
      </Link>
      <button
        type="button"
        onClick={() => { onNavigate?.(); onSignOut(); }}
        className="text-xs text-gray-600 hover:text-gray-400 bg-transparent border-0 p-1 cursor-pointer"
      >
        {t('auth.signOut')}
      </button>
    </div>
  );
}
