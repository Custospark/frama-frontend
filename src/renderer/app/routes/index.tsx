import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ROUTES } from './constants/shared.paths';
import { ProtectedRoute } from './middleware/ProtectedRoute';
import { PageLoader } from '../../shared/components/loading/Spinner';
import { useAuth } from '../contexts/useAuth';

const LoginPage = lazy(() => import('../../modules/auth/LoginPage'));
const ChangePinPage = lazy(() => import('../../modules/auth/ChangePinPage'));

const ManagerDashboardPage = lazy(() => import('../../modules/report/ManagerDashboardPage'));
const ReportPage = lazy(() => import('../../modules/report/ReportPage'));
const AssetsPage = lazy(() => import('../../modules/assets/AssetsPage'));

const AdminDashboardPage = lazy(() => import('../../modules/admin/AdminDashboardPage'));
const AdminReportsPage = lazy(() => import('../../modules/admin/AdminReportsPage'));
const AdminBranchesPage = lazy(() => import('../../modules/admin/AdminBranchesPage'));
const AdminUsersPage = lazy(() => import('../../modules/admin/AdminUsersPage'));
const AdminBusinessTypesPage = lazy(() => import('../../modules/admin/AdminBusinessTypesPage'));
const FieldBuilderPage = lazy(() => import('../../modules/customfields/FieldBuilderPage'));
const BranchSharePage = lazy(() => import('../../modules/share/BranchSharePage'));

/** Authenticated branch summary - reads the branch slug from the URL. */
function BranchShareRoute() {
  const { slug } = useParams<{ slug: string }>();
  return <BranchSharePage slug={slug ?? ''} />;
}

/** Sends an authenticated user to the dashboard appropriate to their role. */
function RoleHome() {
  const { user, isInitialized } = useAuth();
  if (!isInitialized) return <PageLoader />;
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  return (
    <Navigate
      to={user.role === 'manager' ? ROUTES.MANAGER.DASHBOARD : ROUTES.ADMIN.DASHBOARD}
      replace
    />
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path={ROUTES.HOME} element={<RoleHome />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.CHANGE_PIN} element={<ChangePinPage />} />

        {/* Shareable read-only branch summary - login required (any role) */}
        <Route
          path={ROUTES.SHARE.BRANCH}
          element={
            <ProtectedRoute roles={['manager', 'executive', 'platform_admin']}>
              <BranchShareRoute />
            </ProtectedRoute>
          }
        />

        {/* Manager (own branch) */}
        <Route
          path={ROUTES.MANAGER.DASHBOARD}
          element={
            <ProtectedRoute roles={['manager']}>
              <ManagerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MANAGER.NEW_REPORT}
          element={
            <ProtectedRoute roles={['manager']}>
              <ReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MANAGER.ASSETS}
          element={
            <ProtectedRoute roles={['manager']}>
              <AssetsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.MANAGER.FIELDS}
          element={
            <ProtectedRoute roles={['manager']}>
              <FieldBuilderPage />
            </ProtectedRoute>
          }
        />

        {/* Executive + Platform admin */}
        <Route
          path={ROUTES.ADMIN.DASHBOARD}
          element={
            <ProtectedRoute roles={['executive']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.REPORTS}
          element={
            <ProtectedRoute roles={['executive']}>
              <AdminReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.BRANCHES}
          element={
            <ProtectedRoute roles={['executive']}>
              <AdminBranchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.BUSINESS_TYPES}
          element={
            <ProtectedRoute roles={['platform_admin']}>
              <AdminBusinessTypesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.FIELDS}
          element={
            <ProtectedRoute roles={['manager']}>
              <FieldBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.ADMIN.USERS}
          element={
            <ProtectedRoute roles={['platform_admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </Suspense>
  );
}
