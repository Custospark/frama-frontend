import { useState } from 'react';
import {
  AlignLeft,
  Calculator,
  CheckSquare,
  Hash,
  LayoutList,
  ListChecks,
  Paperclip,
  Tag,
  Type,
} from 'lucide-react';
import { Button } from '../../shared/components/buttons/Button';
import { Modal } from '../../shared/components/modals/Modal';
import {
  FormField,
  FormFooter,
  FormHero,
  FormSection,
  formInputClass,
  formSelectClass,
} from '../../shared/components/forms/formFields';
import { apiErrorMessage } from '../../shared/utils/apiErrorMessage';
import { useToast } from '../../app/contexts/useToast';
import {
  useCreateCustomField,
  useUpdateCustomField,
  type CustomFieldPayload,
} from './CustomFieldQueries';
import { FIELD_TYPES } from './customFieldMeta';
import type {
  BusinessType,
  CustomField,
  CustomFieldOption,
  CustomFieldScope,
  CustomFieldType,
} from '../../shared/types/models';

interface FormState {
  id?: number;
  scope: CustomFieldScope;
  business_type_id: number | '';
  label: string;
  type: CustomFieldType;
  help_text: string;
  placeholder: string;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  optionsText: string;
  min: string;
  max: string;
  max_length: string;
  accept: string;
  formula: string;
  precision: string;
}

const EMPTY_FORM: FormState = {
  scope: 'report',
  business_type_id: '',
  label: '',
  type: 'text',
  help_text: '',
  placeholder: '',
  is_required: false,
  is_active: true,
  sort_order: 0,
  optionsText: '',
  min: '',
  max: '',
  max_length: '',
  accept: '',
  formula: '',
  precision: '',
};

interface CustomFieldFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The field being edited, or null to create a new one. */
  editing: CustomField | null;
  /** Scope preselected when creating from the page toggle. */
  defaultScope: CustomFieldScope;
  /** Business type preselected when creating from the page filter. */
  defaultBusinessTypeId: number | '';
  businessTypes: BusinessType[];
  /** Called after a field is created or updated. */
  onSaved?: (field: CustomField) => void;
}

function initialForm(
  editing: CustomField | null,
  defaultScope: CustomFieldScope,
  defaultBusinessTypeId: number | '',
  businessTypes: BusinessType[],
): FormState {
  if (editing) {
    return {
      id: editing.id,
      scope: editing.scope,
      business_type_id: editing.business_type_id ?? '',
      label: editing.label,
      type: editing.type,
      help_text: editing.help_text ?? '',
      placeholder: editing.placeholder ?? '',
      is_required: editing.is_required,
      is_active: editing.is_active,
      sort_order: editing.sort_order,
      optionsText: (editing.options ?? []).map((o) => o.value).join('\n'),
      min: editing.validation?.min !== undefined ? String(editing.validation.min) : '',
      max: editing.validation?.max !== undefined ? String(editing.validation.max) : '',
      max_length:
        editing.validation?.max_length !== undefined ? String(editing.validation.max_length) : '',
      accept: editing.validation?.accept ?? '',
      formula: editing.validation?.formula ?? '',
      precision: editing.validation?.precision !== undefined ? String(editing.validation.precision) : '',
    };
  }
  return {
    ...EMPTY_FORM,
    scope: defaultScope,
    business_type_id:
      defaultBusinessTypeId === '' ? businessTypes[0]?.id ?? '' : defaultBusinessTypeId,
  };
}

export function CustomFieldFormModal(props: CustomFieldFormModalProps) {
  if (!props.isOpen) return null;
  // Remount (and re-seed the form) whenever the target field or open state changes.
  const key = props.editing ? `edit-${props.editing.id}` : `new-${props.defaultScope}-${props.defaultBusinessTypeId}`;
  return <CustomFieldFormBody key={key} {...props} />;
}

function CustomFieldFormBody({
  isOpen,
  onClose,
  editing,
  defaultScope,
  defaultBusinessTypeId,
  businessTypes,
  onSaved,
}: CustomFieldFormModalProps) {
  const { showToast } = useToast();
  const createField = useCreateCustomField();
  const updateField = useUpdateCustomField();

  const [form, setForm] = useState<FormState>(() =>
    initialForm(editing, defaultScope, defaultBusinessTypeId, businessTypes),
  );
  const [error, setError] = useState<string | undefined>();

  const buildOptions = (): CustomFieldOption[] | undefined => {
    if (form.type !== 'select') return undefined;
    return form.optionsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((value) => ({ value, label: value }));
  };

  const buildValidation = () => {
    const validation: Record<string, number | string> = {};
    if (form.type === 'number') {
      if (form.min !== '') validation.min = Number(form.min);
      if (form.max !== '') validation.max = Number(form.max);
    }
    if (form.type === 'text' || form.type === 'textarea') {
      if (form.max_length !== '') validation.max_length = Number(form.max_length);
    }
    if (form.type === 'file' && form.accept.trim()) {
      validation.accept = form.accept.trim();
    }
    if (form.type === 'calculated') {
      if (form.formula.trim()) validation.formula = form.formula.trim();
      if (form.precision !== '') validation.precision = Number(form.precision);
    }
    return Object.keys(validation).length ? validation : undefined;
  };

  const handleSave = async () => {
    setError(undefined);
    if (form.business_type_id === '') {
      setError('Please choose a business type.');
      return;
    }
    if (!form.label.trim()) {
      setError('Please enter a field label.');
      return;
    }
    if (form.type === 'select' && !buildOptions()?.length) {
      setError('A dropdown needs at least one option (one per line).');
      return;
    }
    if (form.type === 'calculated' && !form.formula.trim()) {
      setError('A calculated field needs a formula.');
      return;
    }
    const payload: CustomFieldPayload = {
      scope: form.scope,
      business_type_id: Number(form.business_type_id),
      label: form.label.trim(),
      type: form.type,
      help_text: form.help_text.trim() || null,
      placeholder: form.placeholder.trim() || null,
      is_required: form.is_required,
      is_active: form.is_active,
      sort_order: form.sort_order,
      options: buildOptions(),
      validation: buildValidation(),
    };
    try {
      let saved: CustomField;
      if (form.id) {
        saved = await updateField.mutateAsync({ id: form.id, ...payload });
        showToast('success', 'Field updated.');
      } else {
        saved = await createField.mutateAsync(payload);
        showToast('success', 'Field added.');
      }
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the field.'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={form.id ? 'Edit field' : 'Add field'}
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        className="space-y-4"
      >
        <FormHero
          icon={LayoutList}
          title={form.id ? 'Update field' : 'New field'}
          description="Fields appear on the daily report form, grouped by business type."
        />

        <FormSection title="Definition" icon={Tag} description="What the field is called and who it applies to.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Applies to" icon={LayoutList} required>
              <select
                className={formSelectClass}
                value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value as CustomFieldScope })}
              >
                <option value="report">Daily Reports</option>
                <option value="asset">Assets</option>
              </select>
            </FormField>

            <FormField label="Business type" icon={Tag} required>
              <select
                className={formSelectClass}
                value={form.business_type_id}
                onChange={(e) =>
                  setForm({ ...form, business_type_id: e.target.value === '' ? '' : Number(e.target.value) })
                }
              >
                <option value="" disabled>Select a business type</option>
                {businessTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Label" icon={Type} required>
              <input
                className={formInputClass}
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Rooms Occupied"
                autoFocus
              />
            </FormField>

            <FormField label="Field type" icon={ListChecks} required>
              <select
                className={formSelectClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CustomFieldType })}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Helper text" icon={AlignLeft} hint="Shown under the field as guidance.">
            <input
              className={formInputClass}
              value={form.help_text}
              onChange={(e) => setForm({ ...form, help_text: e.target.value })}
              placeholder="Optional guidance for the manager"
            />
          </FormField>

          <FormField label="Placeholder" icon={Type}>
            <input
              className={formInputClass}
              value={form.placeholder}
              onChange={(e) => setForm({ ...form, placeholder: e.target.value })}
              placeholder="e.g. Enter a number"
            />
          </FormField>
        </FormSection>

        {form.type === 'select' && (
          <FormSection title="Options" icon={ListChecks} description="One option per line.">
            <FormField label="Options" icon={ListChecks} required>
              <textarea
                className={`${formInputClass} min-h-[110px]`}
                value={form.optionsText}
                onChange={(e) => setForm({ ...form, optionsText: e.target.value })}
                placeholder={'Excellent\nGood\nNeeds attention'}
              />
            </FormField>
          </FormSection>
        )}

        {form.type === 'number' && (
          <FormSection title="Validation" icon={Hash} description="Optional numeric limits.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Minimum" icon={Hash}>
                <input
                  className={formInputClass}
                  type="number"
                  value={form.min}
                  onChange={(e) => setForm({ ...form, min: e.target.value })}
                  placeholder="0"
                />
              </FormField>
              <FormField label="Maximum" icon={Hash}>
                <input
                  className={formInputClass}
                  type="number"
                  value={form.max}
                  onChange={(e) => setForm({ ...form, max: e.target.value })}
                  placeholder="e.g. 1000"
                />
              </FormField>
            </div>
          </FormSection>
        )}

        {form.type === 'calculated' && (
          <FormSection
            title="Calculation"
            icon={Calculator}
            description="Reference other field keys. Operators: + - * / % ^ and comparisons > < >= <= == != with parentheses ( ). Functions: min, max, sum, round, abs, ceil, floor, if."
          >
            <FormField label="Formula" icon={Calculator} required>
              <input
                className={`${formInputClass} font-mono`}
                value={form.formula}
                onChange={(e) => setForm({ ...form, formula: e.target.value })}
                placeholder="e.g. rooms_rev + bar_rev"
              />
            </FormField>
            <FormField label="Decimal places" icon={Hash} hint="How many decimals to round the result to.">
              <input
                className={formInputClass}
                type="number"
                min={0}
                max={6}
                value={form.precision}
                onChange={(e) => setForm({ ...form, precision: e.target.value })}
                placeholder="2"
              />
            </FormField>
          </FormSection>
        )}

        {(form.type === 'text' || form.type === 'textarea') && (
          <FormSection title="Validation" icon={Type} description="Optional character limit.">
            <FormField label="Max length" icon={Type}>
              <input
                className={formInputClass}
                type="number"
                value={form.max_length}
                onChange={(e) => setForm({ ...form, max_length: e.target.value })}
                placeholder="e.g. 255"
              />
            </FormField>
          </FormSection>
        )}

        {form.type === 'file' && (
          <FormSection title="Validation" icon={Paperclip} description="Allowed file types.">
            <FormField label="Accepted extensions" icon={Paperclip} hint="Comma separated, e.g. pdf,jpg,png">
              <input
                className={formInputClass}
                value={form.accept}
                onChange={(e) => setForm({ ...form, accept: e.target.value })}
                placeholder="pdf,jpg,png"
              />
            </FormField>
          </FormSection>
        )}

        <FormSection title="Behaviour" icon={CheckSquare} description="How the field behaves on the form.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_required}
                onChange={(e) => setForm({ ...form, is_required: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Required
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Active
            </label>
          </div>
          <FormField label="Sort order" icon={Hash} hint="Lower numbers appear first.">
            <input
              className={formInputClass}
              type="number"
              value={String(form.sort_order)}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
            />
          </FormField>
        </FormSection>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <FormFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={createField.isPending || updateField.isPending}>
            {form.id ? 'Save field' : 'Add field'}
          </Button>
        </FormFooter>
      </form>
    </Modal>
  );
}
