import type { ElementType } from 'react';
import { BarChart3, Boxes, Building2, FileText, LayoutList, Tags, Upload, Users } from 'lucide-react';
import { ROUTES } from '../../../app/routes/constants/shared.paths';
import type { UserRole } from '../../types/models';

export interface SidebarSubItem {
  to: string;
  label: string;
  icon: ElementType;
}

export interface SidebarNavGroup {
  icon: ElementType;
  label: string;
  /** Roles allowed to see this group. */
  roles: UserRole[];
  subItems: SidebarSubItem[];
}

/**
 * Frama shell navigation, grouped logically like the Custosell sidebar.
 *
 * - Managers: the reporting + branch surfaces for their own branch, with a
 *   dedicated "Reports" group so uploading a report is an obvious action.
 * - Executives: cross-branch dashboards and the branch directory.
 * - Platform admins: everything, plus the administrative masters.
 */
export const baseNavGroups: SidebarNavGroup[] = [
  {
    icon: FileText,
    label: 'Reports',
    roles: ['manager'],
    subItems: [
      { to: ROUTES.MANAGER.DASHBOARD, label: 'Dashboard', icon: BarChart3 },
      { to: ROUTES.MANAGER.NEW_REPORT, label: 'Upload Report', icon: Upload },
    ],
  },
  {
    icon: Building2,
    label: 'My Branch',
    roles: ['manager'],
    subItems: [
      { to: ROUTES.MANAGER.ASSETS, label: 'Assets', icon: Boxes },
      { to: ROUTES.MANAGER.FIELDS, label: 'Report Fields', icon: LayoutList },
    ],
  },
  {
    icon: BarChart3,
    label: 'Dashboard',
    roles: ['executive', 'platform_admin'],
    subItems: [
      { to: ROUTES.ADMIN.DASHBOARD, label: 'Overview', icon: BarChart3 },
      { to: ROUTES.ADMIN.REPORTS, label: 'All Reports', icon: FileText },
    ],
  },
  {
    icon: Building2,
    label: 'Organisation',
    roles: ['executive', 'platform_admin'],
    subItems: [
      { to: ROUTES.ADMIN.BRANCHES, label: 'Branches', icon: Building2 },
    ],
  },
  {
    icon: Tags,
    label: 'Configuration',
    roles: ['platform_admin'],
    subItems: [
      { to: ROUTES.ADMIN.BUSINESS_TYPES, label: 'Business Types', icon: Tags },
      { to: ROUTES.ADMIN.FIELDS, label: 'Report Fields', icon: LayoutList },
      { to: ROUTES.ADMIN.USERS, label: 'Users', icon: Users },
    ],
  },
  {
    icon: Tags,
    label: 'Configuration',
    roles: ['executive'],
    subItems: [
      { to: ROUTES.ADMIN.FIELDS, label: 'Report Fields', icon: LayoutList },
    ],
  },
];

/** Groups visible to the given role. */
export function navGroupsForRole(role: UserRole | undefined): SidebarNavGroup[] {
  if (!role) return [];
  return baseNavGroups.filter((group) => group.roles.includes(role));
}

/** All nav target paths for a role, used to resolve the active group. */
export function navSubRoutesForRole(role: UserRole | undefined): string[] {
  return navGroupsForRole(role).flatMap((group) => group.subItems.map((item) => item.to));
}
