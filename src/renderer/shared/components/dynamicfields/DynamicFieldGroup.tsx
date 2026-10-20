import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { CustomField, CustomValues } from '../../types/models';
import { DynamicField } from './DynamicField';
import { cn } from '../../utils/cn';

interface DynamicFieldGroupProps {
  fields: CustomField[];
  values: CustomValues;
  onChange: (key: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

/**
 * Group custom fields by business type and render each group as a collapsible,
 * responsive section. Fields without a business type fall under "General".
 */
export function DynamicFieldGroup({ fields, values, onChange, errors = {}, disabled }: DynamicFieldGroupProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  if (fields.length === 0) return null;

  const groups: { key: string; label: string; fields: CustomField[] }[] = [];

  const general = fields.filter((f) => !f.business_type_id);
  if (general.length) groups.push({ key: 'general', label: 'General', fields: general });

  const byType = new Map<string, { label: string; fields: CustomField[] }>();
  for (const field of fields) {
    if (!field.business_type_id) continue;
    const key = String(field.business_type_id);
    if (!byType.has(key)) {
      byType.set(key, { label: field.business_type?.name ?? 'Business Type', fields: [] });
    }
    byType.get(key)!.fields.push(field);
  }

  for (const [key, group] of byType) {
    groups.push({ key, label: group.label, fields: group.fields });
  }

  const isOpen = (key: string) => open[key] ?? true;

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.key} className="overflow-hidden rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setOpen((prev) => ({ ...prev, [group.key]: !isOpen(group.key) }))}
            className="flex w-full items-center justify-between bg-gray-50 px-4 py-2.5 text-left"
          >
            <span className="text-sm font-semibold text-gray-700">{group.label}</span>
            <ChevronDown
              className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen(group.key) && 'rotate-180')}
            />
          </button>

          {isOpen(group.key) && (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              {group.fields.map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  value={values[field.key]}
                  onChange={(value) => onChange(field.key, value)}
                  error={errors[`custom_values.${field.key}`] ?? errors[field.key]}
                  disabled={disabled}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
