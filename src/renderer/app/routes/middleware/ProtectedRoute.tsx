import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { PageLoader } from '../../../shared/components/loading/Spinner';
import { ROUTES } from '../constants/shared.paths';
import type { UserRole } from '../../../shared/types/models';

interface ProtectedRouteProps {
  children: ReactNode;
  /** When provided, the user's role must be at least one of these. */
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized, hasAtLeastRole, user } = useAuth();
  const location = useLocation();

  if (!isInitialized) {
    return <PageLoader label="Preparing your dashboard…" />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.some((role) => hasAtLeastRole(role))) {
    const fallback = user.role === 'manager' ? ROUTES.MANAGER.DASHBOARD : ROUTES.ADMIN.DASHBOARD;
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
