import { createContext, useContext } from 'react';
import type { AuthUser, UserRole } from '../../shared/types/models';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  login: (accessCode: string, pin: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** True when the user's role is exactly one of the given roles. */
  hasRole: (...roles: UserRole[]) => boolean;
  /** True when the user's role outranks or equals the given role. */
  hasAtLeastRole: (role: UserRole) => boolean;
  canViewAllBranches: boolean;
}

const ROLE_RANK: Record<UserRole, number> = {
  manager: 1,
  executive: 2,
  platform_admin: 3,
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { ROLE_RANK };
