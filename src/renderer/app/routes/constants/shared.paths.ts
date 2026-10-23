import type { UserRole } from '../../../shared/types/models';

export const ROUTES = {
  /** The app root is the login page - there is no landing or register page. */
  HOME: '/',
  LOGIN: '/login',
  CHANGE_PIN: '/change-pin',

  /** Authenticated, read-only branch summary - short slug link shared via WhatsApp. */
  SHARE: {
    BRANCH: '/share/branch/:slug',
    branch: (slug: string) => `/share/branch/${slug}`,
  },

  /** Manager dashboard (own branch). */
  MANAGER: {
    DASHBOARD: '/manager',
    NEW_REPORT: '/manager/report',
    ASSETS: '/manager/assets',
    FIELDS: '/manager/fields',
  },

  /** Executive / platform admin dashboard. */
  ADMIN: {
    DASHBOARD: '/admin',
    REPORTS: '/admin/reports',
    BRANCHES: '/admin/branches',
    USERS: '/admin/users',
    BUSINESS_TYPES: '/admin/business-types',
    FIELDS: '/admin/fields',
  },
} as const;

/** Landing route after sign-in for each role. */
export function homeRouteFor(role: UserRole): string {
  return role === 'manager' ? ROUTES.MANAGER.DASHBOARD : ROUTES.ADMIN.DASHBOARD;
}
