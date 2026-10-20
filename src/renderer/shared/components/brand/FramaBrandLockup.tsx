import { Building2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PRODUCT_NAME, TAGLINE } from '../../brand/framaBrand';

interface FramaBrandLockupProps {
  /** Show the tagline underneath the product name. */
  showTagline?: boolean;
  /** Stack the wordmark below the logo instead of beside it. */
  stacked?: boolean;
  logoSize?: 'sm' | 'md' | 'lg';
  nameClassName?: string;
  taglineClassName?: string;
  className?: string;
}

const LOGO_BOX: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const LOGO_ICON: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-5 w-5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/**
 * Frama Investments product lockup - rounded blue logo mark + wordmark
 * (+ optional tagline), mirroring the Custosell shell branding treatment.
 * Used in the sidebar header and the top header so branding stays consistent.
 */
export function FramaBrandLockup({
  showTagline = false,
  stacked = false,
  logoSize = 'sm',
  nameClassName,
  taglineClassName,
  className,
}: FramaBrandLockupProps) {
  return (
    <div
      className={cn('flex min-w-0 items-center gap-2.5', stacked && 'flex-col text-center', className)}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm',
          LOGO_BOX[logoSize],
        )}
      >
        <Building2 className={LOGO_ICON[logoSize]} />
      </span>
      <div className="min-w-0 leading-tight">
        <span className={cn('block truncate text-lg font-bold text-blue-600', stacked && 'w-full', nameClassName)}>
          {PRODUCT_NAME}
        </span>
        {showTagline && (
          <span className={cn('block truncate text-[10px] font-semibold text-blue-600', taglineClassName)}>
            {TAGLINE}
          </span>
        )}
      </div>
    </div>
  );
}
