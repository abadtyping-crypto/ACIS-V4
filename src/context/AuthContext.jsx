import { createContext, useContext, useMemo, useState } from 'react';
import { fetchTenantUsersMap } from '../lib/backendStore';

const AUTH_STORAGE_KEY = 'acis_auth_session_v1';
const AuthContext = createContext(null);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = new Set(['Super Admin', 'Admin', 'Manager', 'Accountant', 'Staff']);
const ALLOWED_STATUS = new Set(['Active', 'Frozen']);

const readSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.user || !parsed.tenantId) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeSession = (session) => {
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(readSession);

  const loginWithUid = async (tenantId, inputId, password) => {
    // We fetch all users first to ensure case-insensitive matching for legacy users who might have mixed case
    const usersRes = await fetchTenantUsersMap(tenantId);
    if (!usersRes.ok) return { ok: false, error: 'Failed to access tenant users.' };

    const searchStr = String(inputId).toLowerCase();
    const matchedUser = usersRes.rows.find(u =>
      String(u.uid).toLowerCase() === searchStr ||
      String(u.email || '').toLowerCase() === searchStr ||
      String(u.displayName || '').toLowerCase() === searchStr
    );

    if (!matchedUser) return { ok: false, error: 'User not found in this tenant workspace.' };

    // Set result.data as if it just came from a getDoc call
    const result = { data: matchedUser };
    if (result.data.password) {
      if (!password || password !== result.data.password) {
        return { ok: false, error: 'Incorrect password.' };
      }
    }

    const rawUser = {
      uid: result.data.uid,
      displayName: result.data.displayName || 'User',
      role: result.data.role || 'Staff',
      email: result.data.email || '',
      photoURL: result.data.photoURL || '/avatar.png',
      status: result.data.status || 'Active',
    };

    const displayName = String(rawUser.displayName || '').trim();
    const email = String(rawUser.email || '').trim().toLowerCase();
    const role = String(rawUser.role || '').trim();
    const status = String(rawUser.status || '').trim();

    if (!displayName) {
      return { ok: false, error: 'Invalid user profile: displayName is required.' };
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return { ok: false, error: 'Invalid user profile: valid email is required.' };
    }
    if (!role || !ALLOWED_ROLES.has(role)) {
      return { ok: false, error: 'Invalid user profile: role is missing or not allowed.' };
    }
    if (!status || !ALLOWED_STATUS.has(status)) {
      return { ok: false, error: 'Invalid user profile: status is missing or not allowed.' };
    }
    if (status === 'Frozen') {
      return { ok: false, error: 'This user is frozen. Contact admin.' };
    }

    const user = {
      uid: rawUser.uid,
      displayName,
      email,
      role,
      status,
      photoURL: rawUser.photoURL,
    };

    const nextSession = { tenantId, user };
    setSession(nextSession);
    writeSession(nextSession);
    return { ok: true, user };
  };

  const logout = () => {
    setSession(null);
    writeSession(null);
  };

  const patchSessionUser = (patch) => {
    setSession((prev) => {
      if (!prev?.user || !prev?.tenantId) return prev;
      const next = {
        ...prev,
        user: {
          ...prev.user,
          ...(patch || {}),
        },
      };
      writeSession(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      tenantId: session?.tenantId || null,
      isAuthenticated: Boolean(session?.user && session?.tenantId),
      loginWithUid,
      logout,
      patchSessionUser,
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
