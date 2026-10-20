import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import axios from 'axios';
import { axiosInstance, setStoredToken, getStoredToken } from '../api/axiosConfig';
import { ENDPOINTS } from '../../shared/api/endpoints/endpoints';
import { AuthContext, ROLE_RANK, type AuthContextValue } from './useAuth';
import type { AuthUser, UserRole } from '../../shared/types/models';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const existing = getStoredToken();
      if (!existing) {
        setIsInitialized(true);
        return;
      }
      try {
        const { data } = await axiosInstance.get<{ data: AuthUser }>(ENDPOINTS.AUTH.ME);
        setUser(data.data);
        setToken(existing);
      } catch {
        setStoredToken(null);
        setUser(null);
        setToken(null);
      } finally {
        setIsInitialized(true);
      }
    };

    void bootstrap();
  }, []);

  const login = useCallback(async (accessCode: string, pin: string) => {
    const { data } = await axiosInstance.post<{ user: AuthUser; token: string }>(
      ENDPOINTS.AUTH.LOGIN,
      { access_code: accessCode, pin },
    );
    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      if (!axios.isAxiosError(error)) throw error;
    } finally {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    }
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => Boolean(user && roles.includes(user.role)),
    [user],
  );

  const hasAtLeastRole = useCallback(
    (role: UserRole) => Boolean(user && ROLE_RANK[user.role] >= ROLE_RANK[role]),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isInitialized,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
      hasRole,
      hasAtLeastRole,
      canViewAllBranches: hasAtLeastRole('executive'),
    }),
    [user, token, isInitialized, login, logout, hasRole, hasAtLeastRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
