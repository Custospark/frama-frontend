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

/**
 * Frama Investments product lockup - circular Frama logo + wordmark
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
          'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-gray-200',
          LOGO_BOX[logoSize],
        )}
      >
        <img
          src="/frama-logo.png"
          alt={`${PRODUCT_NAME} logo`}
          className="h-full w-full object-cover"
        />
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
