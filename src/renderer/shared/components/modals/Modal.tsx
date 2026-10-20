import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  bodyClassName?: string;
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' };

export function Modal({ isOpen, onClose, title, children, footer, size = 'md', bodyClassName }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 py-8 sm:p-6 sm:py-12" onClick={onClose}>
      <div
        className={cn(
          'my-auto flex max-h-[min(90vh,calc(100dvh-4rem))] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[min(85vh,calc(100dvh-6rem))]',
          sizes[size],
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <button type="button" onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', bodyClassName ?? 'px-5 py-4')}>
          {children}
        </div>
        {footer && <div className="flex shrink-0 justify-end gap-2 border-t border-gray-200 px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
