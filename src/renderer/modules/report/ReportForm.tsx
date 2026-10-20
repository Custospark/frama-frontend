import { useMemo, useRef, useState } from 'react';
import {
  Building2,
  CalendarDays,
  CheckSquare,
  CircleDollarSign,
  FolderArchive,
  FolderPlus,
  HandCoins,
  Image as ImageIcon,
  Layers,
  ListPlus,
  MessageSquareText,
  Paperclip,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  UtensilsCrossed,
  Wine,
  BedDouble,
  Flame,
  Wallet,
} from 'lucide-react';
import { Button } from '../../shared/components/buttons/Button';
import { Modal } from '../../shared/components/modals/Modal';
import { MoneyInput } from '../../shared/components/inputs/MoneyInput';
import { DynamicField } from '../../shared/components/dynamicfields/DynamicField';
import { CustomFieldFormModal } from '../customfields/CustomFieldFormModal';
import { useCustomFields, useDeleteCustomField } from '../customfields/CustomFieldQueries';
import { useBusinessTypes } from '../businesstypes/BusinessTypeQueries';
import { useAuth } from '../../app/contexts/useAuth';
import { useToast } from '../../app/contexts/useToast';
import { apiErrorMessage } from '../../shared/utils/apiErrorMessage';
import {
  FormField,
  FormFooter,
  FormHero,
  FormSection,
  formInputClass,
  formTextareaClass,
} from '../../shared/components/forms/formFields';
import { formatMoney, parseMoney } from '../../shared/utils/moneyInput';
import { computeCalculatedFields } from '../../shared/utils/formulaEvaluator';
import { formatCurrency } from '../../shared/utils/formatCurrency';
import { formatFileSize } from '../../shared/utils/formatFileSize';
import { cn } from '../../shared/utils/cn';
import type { BusinessType, CustomField, CustomValues } from '../../shared/types/models';
import type { ReportFormValues } from './ReportQueries';

interface ReportFormProps {
  date: string;
  onDateChange: (date: string) => void;
  onSubmit: (values: ReportFormValues) => Promise<void>;
  submitting: boolean;
  /** Live upload progress (0–100) while the multipart submit is in flight. */
  uploadProgress?: number | null;
  errorMessage?: string;
  todayTotalHint?: string;
}

interface RevenueField {
  key: 'rooms_rev' | 'bar_rev' | 'food_rev' | 'sauna_rev';
  label: string;
  icon: typeof Wallet;
}

const REVENUE_FIELDS: RevenueField[] = [
  { key: 'rooms_rev', label: 'Rooms Revenue', icon: BedDouble },
  { key: 'bar_rev', label: 'Bar Revenue', icon: Wine },
  { key: 'food_rev', label: 'Food Revenue', icon: UtensilsCrossed },
  { key: 'sauna_rev', label: 'Sauna Revenue', icon: Flame },
];

const EMPTY_VALUES: Record<RevenueField['key'], string> = {
  rooms_rev: '',
  bar_rev: '',
  food_rev: '',
  sauna_rev: '',
};

export function ReportForm({ date, onDateChange, onSubmit, submitting, uploadProgress, errorMessage, todayTotalHint }: ReportFormProps) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [expenses, setExpenses] = useState('');
  const [cashHandedOver, setCashHandedOver] = useState('');
  const [comment, setComment] = useState('');
  const [customValues, setCustomValues] = useState<CustomValues>({});
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [touchedTypes, setTouchedTypes] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [zipping, setZipping] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldModalTypeId, setFieldModalTypeId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [confirmDeleteField, setConfirmDeleteField] = useState<CustomField | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  const { data: businessTypes = [] } = useBusinessTypes(true);
  const { data: customFields = [] } = useCustomFields('report');
  const { user } = useAuth();
  const { showToast } = useToast();
  const deleteField = useDeleteCustomField();

  const handleDeleteField = async () => {
    if (!confirmDeleteField) return;
    try {
      await deleteField.mutateAsync(confirmDeleteField.id);
      setCustomValues((prev) => {
        const next = { ...prev };
        delete next[confirmDeleteField.key];
        return next;
      });
      showToast('success', 'Field removed.');
      setConfirmDeleteField(null);
    } catch (err) {
      showToast('error', apiErrorMessage(err, 'Could not remove the field.'));
    }
  };

  const branchTypeId = user?.branch?.business_type_id ?? null;

  const activeTypeIds = useMemo(() => {
    if (touchedTypes) return selectedTypeIds;
    if (branchTypeId && businessTypes.some((type) => type.id === branchTypeId)) {
      return [branchTypeId];
    }
    return [];
  }, [touchedTypes, selectedTypeIds, branchTypeId, businessTypes]);

  const fieldsByType = useMemo(() => {
    const map = new Map<number, typeof customFields>();
    for (const field of customFields) {
      if (!field.business_type_id) continue;
      const list = map.get(field.business_type_id) ?? [];
      list.push(field);
      map.set(field.business_type_id, list);
    }
    return map;
  }, [customFields]);

  const selectedTypes = useMemo(
    () => businessTypes.filter((type) => activeTypeIds.includes(type.id)),
    [businessTypes, activeTypeIds],
  );

  const defaultFieldTypeId = useMemo<number | ''>(() => {
    if (branchTypeId && businessTypes.some((type) => type.id === branchTypeId)) {
      return branchTypeId;
    }
    return selectedTypes[0]?.id ?? businessTypes[0]?.id ?? '';
  }, [branchTypeId, businessTypes, selectedTypes]);

  const toggleType = (type: BusinessType) => {
    setTouchedTypes(true);
    setSelectedTypeIds((prev) => {
      const base = touchedTypes ? prev : activeTypeIds;
      return base.includes(type.id) ? base.filter((id) => id !== type.id) : [...base, type.id];
    });
  };

  const setCustomValue = (key: string, value: unknown) => {
    setCustomValues((prev) => ({ ...prev, [key]: value as CustomValues[string] }));
    setErrors((prev) => ({ ...prev, [key]: '', [`custom_values.${key}`]: '' }));
  };

  const total = useMemo(
    () => REVENUE_FIELDS.reduce((sum, field) => sum + parseMoney(values[field.key] || '0'), 0),
    [values],
  );

  /** Numeric context for calculated-field previews (mirrors what the server computes). */
  const formulaContext = useMemo(() => {
    const context: Record<string, unknown> = {
      rooms_rev: parseMoney(values.rooms_rev || '0'),
      bar_rev: parseMoney(values.bar_rev || '0'),
      food_rev: parseMoney(values.food_rev || '0'),
      sauna_rev: parseMoney(values.sauna_rev || '0'),
      total_rev: total,
      ...customValues,
    };
    const calculatedFields = [...fieldsByType.values()]
      .flat()
      .filter((f) => f.type === 'calculated')
      .map((f) => ({
        key: f.key,
        formula: f.validation?.formula,
        precision: f.validation?.precision,
      }));
    if (calculatedFields.length > 0) {
      Object.assign(context, computeCalculatedFields(calculatedFields, context));
    }
    return context;
  }, [values, customValues, total, fieldsByType]);

  const setField = (key: RevenueField['key'], raw: string) => {
    setValues((prev) => ({ ...prev, [key]: formatMoney(raw) }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const fileKey = (file: File) => `${file.name}::${file.size}::${file.lastModified}`;

  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    setAttachments((prev) => {
      const existing = new Set(prev.map(fileKey));
      const merged = [...prev];
      for (const file of incoming) {
        const key = fileKey(file);
        if (existing.has(key)) continue;
        existing.add(key);
        merged.push(file);
        if (file.type.startsWith('image/')) {
          setPreviews((p) => (p[key] ? p : { ...p, [key]: URL.createObjectURL(file) }));
        }
      }
      return merged;
    });
    setErrors((prev) => ({ ...prev, attachments: '' }));
  };

  const removeAttachment = (file: File) => {
    const key = fileKey(file);
    setPreviews((prev) => {
      const next = { ...prev };
      if (next[key]) URL.revokeObjectURL(next[key]);
      delete next[key];
      return next;
    });
    setAttachments((prev) => prev.filter((f) => fileKey(f) !== key));
  };

  const handleFolderPick = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setZipping(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const files = Array.from(fileList);
      const root = files[0]?.webkitRelativePath?.split('/')[0] ?? 'folder';
      for (const file of files) {
        const rel = file.webkitRelativePath || file.name;
        zip.file(rel, file);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      addFiles([new File([blob], `${root}.zip`, { type: 'application/zip' })]);
    } catch {
      showToast('error', 'Could not package the folder. Try zipping it yourself and uploading.');
    } finally {
      setZipping(false);
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!date) next.date = 'Please choose a date.';
    if (attachments.length === 0) next.attachments = 'Attach at least one file.';
    if (REVENUE_FIELDS.every((f) => parseMoney(values[f.key] || '0') <= 0)) {
      next.rooms_rev = 'Enter at least one revenue amount.';
    }
    if (expenses.trim() === '') next.expenses = 'Enter expenses (use 0 if none).';
    if (cashHandedOver.trim() === '') next.cash_handed_over = 'Enter the cash handed over.';
    for (const type of selectedTypes) {
      for (const field of fieldsByType.get(type.id) ?? []) {
        if (field.type === 'calculated') continue;
        const value = customValues[field.key];
        if (field.is_required && (value === undefined || value === null || value === '')) {
          next[field.key] = `${field.label} is required.`;
        }
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || attachments.length === 0) return;
    await onSubmit({
      report_date: date,
      rooms_rev: parseMoney(values.rooms_rev || '0'),
      bar_rev: parseMoney(values.bar_rev || '0'),
      food_rev: parseMoney(values.food_rev || '0'),
      sauna_rev: parseMoney(values.sauna_rev || '0'),
      expenses: parseMoney(expenses || '0'),
      cash_handed_over: parseMoney(cashHandedOver || '0'),
      comment: comment.trim() || null,
      business_type_ids: activeTypeIds,
      attachments,
      custom_values: customValues,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormHero
        icon={Receipt}
        title="Daily revenue report"
        description="Pick the business types you operated today, capture revenue, then attach your files."
      />

      <FormSection title="Report details" icon={CalendarDays} description="The day this report covers and the business types included.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Report date" icon={CalendarDays} required error={errors.date}>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className={formInputClass}
            />
          </FormField>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Business types <span className="text-red-500">*</span>
          </label>
          {businessTypes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              No business types are set up yet. An administrator can add them under Configuration.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {businessTypes.map((type) => {
                const active = activeTypeIds.includes(type.id);
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                    )}
                  >
                    <Building2 className="h-4 w-4" />
                    {type.name}
                    {active && <CheckSquare className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Select every type you recorded revenue for today. Add one only if it applied.
          </p>
        </div>
      </FormSection>

      <FormSection title="Revenue" icon={CircleDollarSign} description="Enter the day's takings for each stream.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {REVENUE_FIELDS.map((field) => (
            <MoneyInput
              key={field.key}
              label={field.label}
              value={values[field.key]}
              onChange={(e) => setField(field.key, e.target.value)}
              error={errors[field.key]}
              placeholder="0"
            />
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Wallet className="h-4 w-4 text-blue-600" /> Total Revenue
          </span>
          <span className="text-2xl font-bold text-blue-700">{formatCurrency(total)}</span>
        </div>
      </FormSection>

      <FormSection
        title="Handover"
        icon={HandCoins}
        description="What was spent today and the cash physically handed over."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MoneyInput
            label="Expenses (UGX)"
            value={expenses}
            onChange={(e) => {
              setExpenses(formatMoney(e.target.value));
              setErrors((prev) => ({ ...prev, expenses: '' }));
            }}
            error={errors.expenses}
            placeholder="0"
          />
          <MoneyInput
            label="Cash Handed Over (UGX)"
            value={cashHandedOver}
            onChange={(e) => {
              setCashHandedOver(formatMoney(e.target.value));
              setErrors((prev) => ({ ...prev, cash_handed_over: '' }));
            }}
            error={errors.cash_handed_over}
            placeholder="0"
          />
        </div>

        {expenses !== '' && cashHandedOver !== '' && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Wallet className="h-4 w-4 text-emerald-600" /> Expected Cash (Revenue − Expenses)
            </span>
            <span className="text-2xl font-bold text-emerald-700">
              {formatCurrency(Math.max(total - parseMoney(expenses || '0'), 0))}
            </span>
          </div>
        )}

        <FormField label="Comment / Problem Faced Today" icon={MessageSquareText}>
          <textarea
            className={`${formTextareaClass} min-h-[100px]`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write any problem, e.g. power outage, guest issue, stock finished…"
            maxLength={2000}
          />
          {comment.length > 0 && (
            <p className="text-xs text-gray-400">{comment.length}/2000</p>
          )}
        </FormField>
      </FormSection>

      {selectedTypes.map((type) => {
        const fields = fieldsByType.get(type.id) ?? [];
        return (
          <FormSection
            key={type.id}
            title={`${type.name} details`}
            icon={Layers}
            description={`Extra fields recorded for ${type.name}.`}
          >
            {fields.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-6 text-center">
                <ListPlus className="h-5 w-5 text-gray-400" />
                <p className="text-sm text-gray-600">No fields for {type.name} yet.</p>
                <Button type="button" variant="outline" size="sm" onClick={() => setFieldModalTypeId(type.id)}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add a field
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.id} className="group relative rounded-xl border border-gray-200 p-3">
                    <div className="absolute right-2 top-2 flex gap-1 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => setEditingField(field)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        aria-label={`Edit ${field.label}`}
                        title="Edit field"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteField(field)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${field.label}`}
                        title="Remove field"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <DynamicField
                      field={field}
                      value={customValues[field.key]}
                      onChange={(value) => setCustomValue(field.key, value)}
                      error={errors[`custom_values.${field.key}`] ?? errors[field.key]}
                      values={formulaContext}
                    />
                  </div>
                ))}
              </div>
            )}
          </FormSection>
        );
      })}

      <Button type="button" variant="outline"         onClick={() => setFieldModalTypeId(defaultFieldTypeId === '' ? null : defaultFieldTypeId)}>
        <Plus className="mr-1.5 h-4 w-4" /> Add another field
      </Button>

      <FormSection
        title="Attachments"
        icon={ImageIcon}
        description="Upload a single file, several files, or a whole folder. Folders are zipped automatically."
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
        />
        <input
          ref={zipRef}
          type="file"
          accept=".zip,.gz,.tar,.rar,.7z,application/zip"
          className="hidden"
          onChange={(e) => {
            addFiles(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
        <input
          ref={folderRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFolderPick(e.target.files);
            e.target.value = '';
          }}
          {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
        />

        {attachments.length === 0 ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-10 text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
          >
            <ImageIcon className="h-7 w-7" />
            <span className="text-sm font-medium">Tap to choose files</span>
            <span className="text-xs text-gray-400">Photos, documents, zips or spreadsheets</span>
          </button>
        ) : (
          <ul className="space-y-2">
            {attachments.map((file) => {
              const key = fileKey(file);
              const previewUrl = previews[key];
              return (
                <li
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5"
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt={file.name} className="h-11 w-11 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                      {file.name.toLowerCase().endsWith('.zip') || file.name.toLowerCase().endsWith('.gz') ? (
                        <FolderArchive className="h-5 w-5" />
                      ) : (
                        <Paperclip className="h-5 w-5" />
                      )}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(file)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Remove ${file.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Plus className="mr-1.5 h-4 w-4" /> Add files
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={zipping}
            onClick={() => folderRef.current?.click()}
          >
            <FolderPlus className="mr-1.5 h-4 w-4" /> Add folder
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => zipRef.current?.click()}>
            <FolderArchive className="mr-1.5 h-4 w-4" /> Add zip
          </Button>
        </div>
        {errors.attachments && <p className="text-sm text-red-600">{errors.attachments}</p>}
      </FormSection>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
      )}

      <FormFooter>
        <div className="flex w-full items-center gap-4">
          {submitting && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                <span className="truncate">
                  {uploadProgress !== null && uploadProgress !== undefined
                    ? `Uploading ${attachments.length} file${attachments.length === 1 ? '' : 's'} (${formatFileSize(attachments.reduce((sum, f) => sum + f.size, 0))})`
                    : 'Preparing upload…'}
                </span>
                <span className="ml-2 shrink-0 tabular-nums">{uploadProgress ?? 0}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-[width] duration-300 ease-out"
                  style={{ width: `${uploadProgress ?? 0}%` }}
                />
              </div>
            </div>
          )}
          <Button
            type="submit"
            size="lg"
            loading={submitting}
            className={submitting ? 'shrink-0' : 'ml-auto w-full sm:w-auto'}
          >
            {submitting ? 'Submitting…' : 'Submit Report'}
          </Button>
        </div>
      </FormFooter>

      {todayTotalHint && <p className="text-center text-xs text-gray-500">{todayTotalHint}</p>}

      <CustomFieldFormModal
        isOpen={fieldModalTypeId !== null || editingField !== null}
        onClose={() => {
          setFieldModalTypeId(null);
          setEditingField(null);
        }}
        editing={editingField}
        defaultScope="report"
        defaultBusinessTypeId={editingField?.business_type_id ?? fieldModalTypeId ?? defaultFieldTypeId}
        businessTypes={businessTypes}
        onSaved={(field) => {
          if (field.business_type_id) {
            setTouchedTypes(true);
            setSelectedTypeIds((prev) => {
              const base = touchedTypes ? prev : activeTypeIds;
              return base.includes(field.business_type_id as number)
                ? base
                : [...base, field.business_type_id as number];
            });
          }
        }}
      />

      <Modal
        isOpen={Boolean(confirmDeleteField)}
        onClose={() => setConfirmDeleteField(null)}
        title="Remove field"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDeleteField(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteField} loading={deleteField.isPending}>Remove</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Remove <span className="font-semibold text-gray-900">{confirmDeleteField?.label}</span>? Existing
          submissions keep their values.
        </p>
      </Modal>
    </form>
  );
}
