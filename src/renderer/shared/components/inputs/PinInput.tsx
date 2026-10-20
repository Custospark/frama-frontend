import { forwardRef, useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { InputHTMLAttributes } from 'react';

interface PinInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'inputMode'> {
  label?: string;
  error?: string;
}

/**
 * 4-6 digit PIN field with a leading key icon and a show/hide toggle, matching
 * the Custosell auth input style (icon inside a rounded field).
 */
const PinInput = forwardRef<HTMLInputElement, PinInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id || 'pin';

    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]*"
            maxLength={6}
            className={cn(
              'block w-full rounded-lg border py-3.5 pl-11 pr-12 text-sm tracking-[0.4em] shadow-sm transition-colors placeholder:tracking-normal placeholder:text-gray-400 focus:outline-none focus:ring-2',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={visible ? 'Hide PIN' : 'Show PIN'}
          >
            {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);
PinInput.displayName = 'PinInput';
export { PinInput };
