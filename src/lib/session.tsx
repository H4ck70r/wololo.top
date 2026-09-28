import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const STORAGE_KEY = 'wololo.session';

export interface SessionUser {
  steam_id: string;
  profile_id: number | null;
  alias: string | null;
  avatar: string | null;
  /** Steam gave us an account we have never seen on the ladder */
  needs_profile: boolean;
}

interface SessionValue {
  user: SessionUser | null;
  loading: boolean;
  /** send the browser to Steam; it comes back at /auth/callback */
  signIn: () => void;
  signOut: () => Promise<void>;
  exchangeCode: (code: string) => Promise<void>;
  claimProfile: (profileId: number) => Promise<void>;
  /** true when this profile is the signed-in visitor's own */
  isSelf: (profileId: number | string | undefined) => boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

// The API lives on another domain, so a cookie set by it would be a
// third-party cookie and Safari would drop it. The token is kept here instead
// and sent in a header.
function readToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode: the session simply lasts as long as the tab */
  }
}

async function authFetch(path: string, init?: RequestInit) {
  const token = readToken();
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Session-Token': token } : {}),
      ...init?.headers,
    },
  });
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!readToken()) {
      setLoading(false);
      return;
    }
    authFetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) {
          // An expired or revoked token is dead weight; drop it rather than
          // retrying it on every page.
          if (res.status === 401) writeToken(null);
          return null;
        }
        return (await res.json()).user as SessionUser;
      })
      .then((u) => alive && setUser(u))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const signIn = useCallback(() => {
    window.location.href = `${BASE_URL}/api/auth/steam`;
  }, []);

  const signOut = useCallback(async () => {
    await authFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    writeToken(null);
    setUser(null);
  }, []);

  const exchangeCode = useCallback(async (code: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error('exchange_failed');
    const data = await res.json();
    writeToken(data.token);
    setUser(data.user);
  }, []);

  const claimProfile = useCallback(async (profileId: number) => {
    const res = await authFetch('/api/auth/claim', {
      method: 'POST',
      body: JSON.stringify({ profile_id: profileId }),
    });
    if (!res.ok) throw new Error(res.status === 409 ? 'already_claimed' : 'claim_failed');
    setUser((await res.json()).user);
  }, []);

  const isSelf = useCallback(
    (profileId: number | string | undefined) =>
      user?.profile_id != null && profileId != null && String(user.profile_id) === String(profileId),
    [user]
  );

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, exchangeCode, claimProfile, isSelf }),
    [user, loading, signIn, signOut, exchangeCode, claimProfile, isSelf]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
