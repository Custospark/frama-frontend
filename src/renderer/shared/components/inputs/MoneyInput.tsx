import { cn } from '../../utils/cn';
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode'> {
  label?: string;
  error?: string;
  currency?: string;
}

/** Numeric revenue field. Stores a plain number string but renders a grouped
 *  value for readability while still allowing dot-precision entry. */
const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, label, error, currency = 'UGX', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-medium text-gray-400">
            {currency}
          </span>
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="decimal"
            min={0}
            step="1"
            onWheel={(e) => e.currentTarget.blur()}
            className={cn(
              'block w-full rounded-lg border px-3 py-2 pl-14 text-right text-sm tabular-nums shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500',
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);
MoneyInput.displayName = 'MoneyInput';
export { MoneyInput };
