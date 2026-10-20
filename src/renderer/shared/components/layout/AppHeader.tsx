import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Menu } from 'lucide-react';
import { cn } from '../../utils/cn';
import { FramaBrandLockup } from '../brand/FramaBrandLockup';
import { ProfileMenu } from './ProfileMenu';
import { SHELL_HEADER_HEIGHT_CLASS } from './layoutConstants';
import { ROUTES } from '../../../app/routes/constants/shared.paths';
import { useAuth } from '../../../app/contexts/useAuth';
import { useToast } from '../../../app/contexts/useToast';
import { nameInitials } from '../../utils/userDisplay';

interface AppHeaderProps {
  onToggleSidebar: () => void;
  sidebarLabel: string;
}

const ACCOUNT_MENU_WIDTH_PX = 260;
const ACCOUNT_MENU_GAP_PX = 6;

export function AppHeader({ onToggleSidebar, sidebarLabel }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: ACCOUNT_MENU_WIDTH_PX });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(ACCOUNT_MENU_WIDTH_PX, window.innerWidth - 16);
    let left = rect.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    setMenuPos({ top: rect.bottom + ACCOUNT_MENU_GAP_PX, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onReposition = () => updateMenuPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    setLoggingOut(true);
    try {
      await logout();
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      showToast('error', 'Could not sign out. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white pr-3 sm:pr-4 lg:pr-6',
        SHELL_HEADER_HEIGHT_CLASS,
      )}
    >
      <button
        type="button"
        onClick={onToggleSidebar}
        className="ml-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        title={sidebarLabel}
        aria-label={sidebarLabel}
      >
        <Menu className="h-5 w-5" />
      </button>

      <FramaBrandLockup logoSize="sm" nameClassName="text-sm" className="min-w-0" />

      <div className="flex flex-1 items-center justify-end gap-1 sm:gap-1.5">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Account menu for ${user?.name ?? 'user'}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-blue-200 transition-colors hover:bg-gray-50 hover:ring-blue-300 lg:gap-2 lg:px-3"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 ring-2 ring-white">
            {nameInitials(user?.name)}
          </span>
          <span className="hidden max-w-[10rem] truncate text-sm font-medium text-gray-700 xl:inline">
            {user?.name}
          </span>
          <ChevronDown
            className={cn('hidden h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform sm:block', open && 'rotate-180')}
          />
        </button>

        <ProfileMenu
          menuRef={menuRef}
          menuPos={menuPos}
          open={open}
          onClose={() => setOpen(false)}
          onLogout={handleLogout}
          isLoggingOut={loggingOut}
          user={user}
        />
      </div>
    </header>
  );
}
