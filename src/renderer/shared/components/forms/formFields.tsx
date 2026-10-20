import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

/** Shared form styling that mirrors the Custosell modal convention: every
 *  control carries a leading icon, sections are carded, and labels/placeholders
 *  are explicit. `pl-10` leaves room for the `left-3` icon gutter. */
export const formLabelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

export const formInputClass =
  'w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

export const formSelectClass =
  'w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-8 text-sm text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

export const formTextareaClass =
  'w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

interface FormSectionProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** A titled, carded group of fields with a header icon and description. */
export function FormSection({ title, icon: Icon, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm', className)}>
      <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        {description && <p className="mt-1 pl-6 text-xs text-gray-500">{description}</p>}
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  icon: LucideIcon;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** A single labeled field with a leading icon positioned over the control. */
export function FormField({ label, icon: Icon, required, hint, error, children }: FormFieldProps) {
  return (
    <div>
      <label className={formLabelClass}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        {children}
      </div>
      {error ? (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}

interface FormHeroProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: 'blue' | 'emerald' | 'slate';
}

const HERO_TONES = {
  blue: 'border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 text-blue-950',
  emerald: 'border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-950',
  slate: 'border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50 text-slate-900',
};

const HERO_ICONS = {
  blue: 'bg-blue-100 text-blue-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  slate: 'bg-slate-200 text-slate-600',
};

/** A banner shown at the top of a form modal to introduce its purpose. */
export function FormHero({ icon: Icon, title, description, tone = 'blue' }: FormHeroProps) {
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3.5', HERO_TONES[tone])}>
      <div className={cn('rounded-lg p-2.5 shadow-sm', HERO_ICONS[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs opacity-80">{description}</p>
      </div>
    </div>
  );
}

/** Sticky action footer used at the bottom of form bodies. */
export function FormFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-1 flex justify-end gap-2 border-t border-gray-100 bg-white/95 px-1 pt-4 backdrop-blur-sm">
      {children}
    </div>
  );
}
