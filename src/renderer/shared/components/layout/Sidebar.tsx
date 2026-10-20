import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Headset, Mail, Phone, X, Building2, ShieldCheck } from 'lucide-react';
import { cn } from '../../utils/cn';
import { FramaBrandLockup } from '../brand/FramaBrandLockup';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '../../brand/framaBrand';
import { ROUTES } from '../../../app/routes/constants/shared.paths';
import { SHELL_HEADER_HEIGHT_CLASS } from './layoutConstants';
import { navGroupsForRole, navSubRoutesForRole } from './sidebarNavGroups';
import { useAuth } from '../../../app/contexts/useAuth';
import { ROLE_LABELS } from '../../utils/userDisplay';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
}

const SUPPORT_TEL = SUPPORT_PHONE.replace(/\s+/g, '');

function isSubItemActive(pathname: string, to: string): boolean {
  if (pathname === to) return true;
  if (to === ROUTES.MANAGER.DASHBOARD || to === ROUTES.ADMIN.DASHBOARD) return false;
  return pathname.startsWith(`${to}/`) || pathname.startsWith(`${to}?`);
}

function getGroupIndexForPath(pathname: string, subRoutes: string[], groupOf: (to: string) => number): number | null {
  for (const route of subRoutes) {
    if (isSubItemActive(pathname, route)) return groupOf(route);
  }
  return null;
}

export function Sidebar({ isOpen, onClose, collapsed }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const navGroups = useMemo(() => navGroupsForRole(user?.role), [user?.role]);
  const subRoutes = useMemo(() => navSubRoutesForRole(user?.role), [user?.role]);

  const groupOf = (to: string): number => {
    for (let i = 0; i < navGroups.length; i++) {
      if (navGroups[i].subItems.some((s) => s.to === to)) return i;
    }
    return -1;
  };

  const currentGroupIndex = getGroupIndexForPath(location.pathname, subRoutes, groupOf);
  const [manualGroup, setManualGroup] = useState<number | null>(null);
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  // Default to the group holding the active route, else the first group, so the
  // reporting actions are always visible without an extra click. A manual click
  // overrides this until the route changes (no setState-in-effect).
  const defaultGroup = currentGroupIndex ?? (navGroups.length > 0 ? 0 : null);
  const openGroup = manualGroup ?? defaultGroup;

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  }, [location.pathname, openGroup, isOpen]);

  return (
    <aside
      className={cn(
        'absolute left-0 top-0 bottom-0 z-40 lg:z-30 flex h-full flex-col',
        'border-r border-gray-200 bg-white transition-all duration-200 transform',
        collapsed ? 'w-[64px]' : 'w-[247px]',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      )}
    >
      <div
        className={cn(
          'shrink-0 border-b border-gray-200 flex items-center gap-2.5',
          SHELL_HEADER_HEIGHT_CLASS,
          collapsed ? 'justify-center px-2' : 'px-5',
        )}
      >
        {collapsed ? (
          <FramaBrandLockup logoSize="sm" nameClassName="hidden" className="gap-0" />
        ) : (
          <FramaBrandLockup logoSize="sm" nameClassName="text-base" className="flex-1" />
        )}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {!collapsed && user && (
          <div className="mb-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                {user.role === 'manager' ? <Building2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {user.role === 'manager'
                    ? user.branch?.branch_name ?? 'Your branch'
                    : ROLE_LABELS[user.role]}
                </p>
                <p className="truncate text-[11px] font-medium uppercase tracking-wide text-blue-600">
                  {ROLE_LABELS[user.role]}{user.role === 'manager' && user.branch ? ` · ${user.branch.code}` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        {!collapsed && (
          <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Menu
          </p>
        )}

        {navGroups.map((group, groupIndex) => {
          const groupOpen = openGroup === groupIndex;
          const Icon = group.icon;
          const hasActiveChild = group.subItems.some((item) => isSubItemActive(location.pathname, item.to));

          if (collapsed) {
            return (
              <div key={group.label} className="flex flex-col items-center gap-1 py-1" title={group.label}>
                {group.subItems.map((item) => {
                  const ItemIcon = item.icon;
                  const active = isSubItemActive(location.pathname, item.to);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end
                      onClick={onClose}
                      title={item.label}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                        active ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                      )}
                    >
                      <ItemIcon className="h-5 w-5" />
                    </NavLink>
                  );
                })}
              </div>
            );
          }

          return (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => setManualGroup(groupOpen ? null : groupIndex)}
                aria-expanded={groupOpen}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors',
                  groupOpen || hasActiveChild
                    ? 'bg-gray-100 font-medium text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-left">{group.label}</span>
                {groupOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {groupOpen && (
                <div className="ml-2 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
                  {group.subItems.map((item) => {
                    const ItemIcon = item.icon;
                    const active = isSubItemActive(location.pathname, item.to);
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        onClick={onClose}
                        ref={active ? activeItemRef : null}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          active
                            ? 'bg-blue-50 font-medium text-blue-700'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
                        )}
                      >
                        <ItemIcon className="h-4 w-4 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-gray-200/60 p-4">
        {!collapsed ? (
          <div className="rounded-xl border border-gray-200/50 bg-gradient-to-br from-gray-50 to-gray-100/50 p-3">
            <div className="flex items-center gap-3">
              <div className="shrink-0 rounded-lg bg-cyan-100 p-2">
                <Headset className="h-4 w-4 text-cyan-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">Quick Support</p>
                <div className="mt-0.5 flex flex-col gap-1">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="inline-flex items-center gap-1 truncate text-xs text-cyan-600 hover:text-cyan-700 hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                  <a
                    href={`tel:${SUPPORT_TEL}`}
                    className="inline-flex items-center gap-1 truncate text-xs text-gray-600 hover:text-gray-700 hover:underline"
                  >
                    {SUPPORT_PHONE}
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-gray-400 transition-colors hover:text-cyan-600"
              title={`Email: ${SUPPORT_EMAIL}`}
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href={`tel:${SUPPORT_TEL}`}
              className="text-gray-400 transition-colors hover:text-cyan-600"
              title={`Call: ${SUPPORT_PHONE}`}
            >
              <Phone className="h-4 w-4" />
            </a>
          </div>
        )}
      </div>
    </aside>
  );
}
