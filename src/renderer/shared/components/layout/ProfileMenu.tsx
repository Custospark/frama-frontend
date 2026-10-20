import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import type { RefObject } from 'react';
import { KeyRound, LogOut } from 'lucide-react';
import { ROUTES } from '../../../app/routes/constants/shared.paths';
import type { AuthUser, UserRole } from '../../types/models';

const ROLE_LABEL: Record<UserRole, string> = {
  manager: 'Manager',
  executive: 'Executive',
  platform_admin: 'Platform Admin',
};

interface ProfileMenuProps {
  menuRef: RefObject<HTMLDivElement | null>;
  menuPos: { top: number; left: number; width: number };
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  user: AuthUser | null;
}

export function ProfileMenu({
  menuRef,
  menuPos,
  open,
  onClose,
  onLogout,
  isLoggingOut,
  user,
}: ProfileMenuProps) {
  if (typeof document === 'undefined') return null;
  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[300] flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
      style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
    >
      <div className="shrink-0 border-b border-gray-100 px-4 py-3">
        <p className="break-words text-sm font-semibold text-gray-900">{user?.name || 'User'}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {user ? ROLE_LABEL[user.role] : ''}
          {user?.branch ? ` · ${user.branch.branch_name}` : ''}
        </p>
        {user?.email && (
          <p className="mt-0.5 truncate text-xs text-gray-400" title={user.email}>
            {user.email}
          </p>
        )}
      </div>

      <Link
        to={ROUTES.CHANGE_PIN}
        role="menuitem"
        onClick={onClose}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
      >
        <KeyRound className="h-4 w-4 shrink-0" />
        Change PIN
      </Link>

      <div className="border-t border-gray-100 pt-1">
        <button
          type="button"
          role="menuitem"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>,
    document.body,
  );
}
