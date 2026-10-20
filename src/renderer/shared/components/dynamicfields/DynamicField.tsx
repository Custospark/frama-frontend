import { useMemo } from 'react';
import {
  AlignLeft,
  Calculator,
  Calendar,
  CheckSquare,
  ChevronDown,
  Hash,
  Paperclip,
  Type,
} from 'lucide-react';
import type { CustomField } from '../../types/models';
import { cn } from '../../utils/cn';
import { computeCalculatedFields } from '../../utils/formulaEvaluator';
import { formatMoney } from '../../utils/moneyInput';

interface DynamicFieldProps {
  field: CustomField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  /** All current form values; used by calculated fields for the live preview. */
  values?: Record<string, unknown>;
}

const baseInput =
  'w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500';

/**
 * Renders a single custom field based on its type. This is the shared renderer
 * used by both the report form and the asset form, so every property type can
 * present a different set of fields.
 */
export function DynamicField({ field, value, onChange, error, disabled, values }: DynamicFieldProps) {
  const inputId = `cf-${field.key}`;
  const borderClass = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-blue-500';

  const preview = useCalculatedPreview(field, values);

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
        <FieldTypeIcon type={field.type} />
        {field.label}
        {field.is_required && <span className="text-red-500">*</span>}
      </label>

      {field.type === 'calculated' ? (
        <div
          id={inputId}
          data-testid={`calculated-${field.key}`}
          className="flex w-full items-center justify-between rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 text-sm"
        >
          <span className="font-medium text-gray-800">
            {preview === null ? '—' : formatMoney(preview.toFixed(2))}
          </span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
            Calculated
          </span>
        </div>
      ) : (
        renderControl(field, inputId, value, onChange, baseInput, borderClass, disabled)
      )}

      {field.help_text && !error && <p className="text-xs text-gray-400">{field.help_text}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/** Live client-side preview of a calculated field (server is authoritative). */
function useCalculatedPreview(
  field: CustomField,
  values: Record<string, unknown> | undefined,
): number | null {
  const formula = field.validation?.formula ?? '';
  const precision = field.validation?.precision ?? 2;

  const computed = useMemo(() => {
    if (field.type !== 'calculated' || !formula.trim() || !values) return null;
    const result = computeCalculatedFields([{ key: field.key, formula, precision }], values);
    const value = result[field.key];
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }, [field.type, field.key, formula, precision, values]);

  return computed;
}

function renderControl(
  field: CustomField,
  inputId: string,
  value: unknown,
  onChange: (value: unknown) => void,
  cls: string,
  borderClass: string,
  disabled?: boolean,
) {
  const common = { id: inputId, disabled, className: cn(cls, borderClass) };

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          {...common}
          rows={3}
          value={String(value ?? '')}
          placeholder={field.placeholder ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'number':
      return (
        <input
          {...common}
          type="text"
          inputMode="numeric"
          value={value === null || value === undefined ? '' : formatMoney(String(value))}
          placeholder={field.placeholder ?? '0'}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
        />
      );

    case 'date':
      return (
        <input
          {...common}
          type="date"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'select':
      return (
        <div className="relative">
          <select
            {...common}
            value={String(value ?? '')}
            className={cn(cls, borderClass, 'appearance-none pr-9')}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">{field.placeholder ?? 'Select…'}</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      );

    case 'checkbox':
      return (
        <label className="flex items-center gap-2.5 rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
          <input
            id={inputId}
            type="checkbox"
            disabled={disabled}
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-600">{field.placeholder || 'Yes'}</span>
        </label>
      );

    case 'file':
      return (
        <input
          {...common}
          type="file"
          accept={field.validation?.accept ? field.validation.accept.split(',').map((v) => `.${v.trim()}`).join(',') : undefined}
          className={cn(cls, borderClass, 'file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700')}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      );

    case 'text':
    default:
      return (
        <input
          {...common}
          type="text"
          value={String(value ?? '')}
          placeholder={field.placeholder ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function FieldTypeIcon({ type }: { type: CustomField['type'] }) {
  const Icon =
    type === 'textarea'
      ? AlignLeft
      : type === 'number'
        ? Hash
        : type === 'date'
          ? Calendar
          : type === 'select'
            ? ChevronDown
            : type === 'checkbox'
              ? CheckSquare
              : type === 'file'
                ? Paperclip
                : type === 'calculated'
                  ? Calculator
                  : Type;
  return <Icon className="h-3.5 w-3.5 text-gray-400" />;
}
