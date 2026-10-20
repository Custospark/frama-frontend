import { useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  CircleDollarSign,
  DoorOpen,
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
  User,
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
import type { CustomField, CustomValues } from '../../shared/types/models';
import type { ReportFormValues } from './ReportQueries';
import { useMyReports } from './ReportQueries';

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

type RevenueKey = 'rooms_rev' | 'bar_rev' | 'food_rev' | 'sauna_rev' | 'other_rev';
type AttachGroup = 'receipt' | 'expense';

interface RevenueField {
  key: RevenueKey;
  label: string;
  required: boolean;
}

const REVENUE_FIELDS: RevenueField[] = [
  { key: 'rooms_rev', label: 'Rooms', required: true },
  { key: 'bar_rev', label: 'Bar', required: false },
  { key: 'food_rev', label: 'Food', required: true },
  { key: 'sauna_rev', label: 'Sauna', required: true },
  { key: 'other_rev', label: 'Other', required: true },
];

const EMPTY_VALUES: Record<RevenueKey, string> = {
  rooms_rev: '',
  bar_rev: '',
  food_rev: '',
  sauna_rev: '',
  other_rev: '',
};

const fileKey = (file: File) => `${file.name}::${file.size}::${file.lastModified}`;

const ATTACHMENT_LIMIT = 50;

interface UploadZoneProps {
  group: AttachGroup;
  title: string;
  files: File[];
  previews: Record<string, string>;
  error?: string;
  onAdd: (files: File[]) => void;
  onRemove: (file: File) => void;
}

/** A single required upload zone: multiple files, a folder (zipped client-side)
 *  or a ready-made zip. Previews are namespaced by group. */
function UploadZone({ group, title, files, previews, error, onAdd, onRemove }: UploadZoneProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const [zipping, setZipping] = useState(false);
  const { showToast } = useToast();

  const handleFolderPick = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setZipping(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const picked = Array.from(fileList);
      const root = picked[0]?.webkitRelativePath?.split('/')[0] ?? 'folder';
      for (const file of picked) {
        zip.file(file.webkitRelativePath || file.name, file);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      onAdd([new File([blob], `${root}.zip`, { type: 'application/zip' })]);
    } catch {
      showToast('error', 'Could not package the folder. Try zipping it yourself and uploading.');
    } finally {
      setZipping(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-800">
          {title} <span className="text-red-500">*</span>
        </p>
        <span className="text-xs text-gray-400">
          {files.length} file{files.length === 1 ? '' : 's'}
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          onAdd(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
      <input
        ref={zipRef}
        type="file"
        accept=".zip,.gz,.tar,.rar,.7z,application/zip"
        className="hidden"
        onChange={(e) => {
          onAdd(Array.from(e.target.files ?? []));
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

      {files.length === 0 ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-8 text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
        >
          <ImageIcon className="h-7 w-7" />
          <span className="text-sm font-medium">Add file</span>
          <span className="text-xs text-gray-400">Photos, documents or zips</span>
        </button>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => {
            const key = `${group}:${fileKey(file)}`;
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
                    {/\.(zip|gz|tar|rar|7z)$/i.test(file.name) ? (
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
                  onClick={() => onRemove(file)}
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

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function ReportForm({ date, onDateChange, onSubmit, submitting, uploadProgress, errorMessage, todayTotalHint }: ReportFormProps) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [roomsOccupied, setRoomsOccupied] = useState('');
  const [expectedOverride, setExpectedOverride] = useState<string | undefined>(undefined);
  const [soFarOverride, setSoFarOverride] = useState<string | undefined>(undefined);
  const [totalCollected, setTotalCollected] = useState('');
  const [expenses, setExpenses] = useState('');
  const [cashHandedOver, setCashHandedOver] = useState('');
  const [comment, setComment] = useState('');
  const [customValues, setCustomValues] = useState<CustomValues>({});
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [expenseFiles, setExpenseFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldModalTypeId, setFieldModalTypeId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [confirmDeleteField, setConfirmDeleteField] = useState<CustomField | null>(null);

  const { data: businessTypes = [] } = useBusinessTypes(true);
  const { data: customFields = [] } = useCustomFields('report');
  const { data: reports = [] } = useMyReports();
  const { user } = useAuth();
  const { showToast } = useToast();
  const deleteField = useDeleteCustomField();

  const branchTypeId = user?.branch?.business_type_id ?? null;
  const branchType = user?.branch?.business_type
    ?? businessTypes.find((type) => type.id === branchTypeId)
    ?? null;
  const isHostel = branchType?.slug === 'hostel';
  const branchName = user?.branch?.branch_name ?? 'Branch';
  const managerName = user?.name ?? '';

  // Semester figures rarely change: carry the latest submitted values forward
  // and let managers override them when they do change.
  const carriedSemester = useMemo(() => {
    const expected = reports.find(
      (report) => report.amount_expected_semester !== null && report.amount_expected_semester !== undefined,
    );
    const soFar = reports.find(
      (report) => report.collected_so_far !== null && report.collected_so_far !== undefined,
    );

    return {
      amountExpected: expected?.amount_expected_semester ?? null,
      collectedSoFar: soFar?.collected_so_far ?? null,
    };
  }, [reports]);

  const expectedInput =
    expectedOverride
    ?? (carriedSemester.amountExpected !== null ? formatMoney(String(carriedSemester.amountExpected)) : '');
  const soFarInput =
    soFarOverride
    ?? (carriedSemester.collectedSoFar !== null ? formatMoney(String(carriedSemester.collectedSoFar)) : '');
  const expectedSemesterValue = expectedInput.trim() !== '' ? parseMoney(expectedInput) : null;
  const collectedSoFarValue = soFarInput.trim() !== '' ? parseMoney(soFarInput) : null;
  const balanceRemaining =
    expectedSemesterValue !== null ? expectedSemesterValue - (collectedSoFarValue ?? 0) : null;

  const activeTypeIds = useMemo(() => (branchTypeId ? [branchTypeId] : []), [branchTypeId]);

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

  const defaultFieldTypeId = useMemo<number | ''>(
    () => branchTypeId ?? businessTypes[0]?.id ?? '',
    [branchTypeId, businessTypes],
  );

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

  const setCustomValue = (key: string, value: unknown) => {
    setCustomValues((prev) => ({ ...prev, [key]: value as CustomValues[string] }));
    setErrors((prev) => ({ ...prev, [key]: '', [`custom_values.${key}`]: '' }));
  };

  const total = useMemo(
    () =>
      isHostel
        ? parseMoney(totalCollected || '0')
        : REVENUE_FIELDS.reduce((sum, field) => sum + parseMoney(values[field.key] || '0'), 0),
    [isHostel, totalCollected, values],
  );

  /** Numeric context for calculated-field previews (mirrors the server's base vars). */
  const formulaContext = useMemo(() => {
    const context: Record<string, unknown> = {
      rooms_rev: isHostel ? 0 : parseMoney(values.rooms_rev || '0'),
      bar_rev: isHostel ? 0 : parseMoney(values.bar_rev || '0'),
      food_rev: isHostel ? 0 : parseMoney(values.food_rev || '0'),
      sauna_rev: isHostel ? 0 : parseMoney(values.sauna_rev || '0'),
      other_rev: isHostel ? 0 : parseMoney(values.other_rev || '0'),
      total_rev: total,
      expenses: parseMoney(expenses || '0'),
      cash_handed_over: parseMoney(cashHandedOver || '0'),
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
  }, [isHostel, values, expenses, cashHandedOver, customValues, total, fieldsByType]);

  const setField = (key: RevenueKey, raw: string) => {
    setValues((prev) => ({ ...prev, [key]: formatMoney(raw) }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const addFiles = (group: AttachGroup, incoming: File[]) => {
    if (incoming.length === 0) return;
    const setList = group === 'receipt' ? setReceiptFiles : setExpenseFiles;
    setList((prev) => {
      const existing = new Set(prev.map(fileKey));
      const merged = [...prev];
      for (const file of incoming) {
        const key = fileKey(file);
        if (existing.has(key)) continue;
        existing.add(key);
        merged.push(file);
        if (file.type.startsWith('image/')) {
          const previewKey = `${group}:${key}`;
          setPreviews((p) => (p[previewKey] ? p : { ...p, [previewKey]: URL.createObjectURL(file) }));
        }
      }
      return merged;
    });
    setErrors((prev) => ({ ...prev, [group === 'receipt' ? 'receipt_photos' : 'expense_receipts']: '' }));
  };

  const removeFile = (group: AttachGroup, file: File) => {
    const previewKey = `${group}:${fileKey(file)}`;
    setPreviews((prev) => {
      const next = { ...prev };
      if (next[previewKey]) URL.revokeObjectURL(next[previewKey]);
      delete next[previewKey];
      return next;
    });
    const setList = group === 'receipt' ? setReceiptFiles : setExpenseFiles;
    setList((prev) => prev.filter((f) => fileKey(f) !== fileKey(file)));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!date) next.date = 'Please choose a date.';

    if (isHostel) {
      if (roomsOccupied.trim() === '') {
        next.rooms_occupied = 'Enter the total rooms occupied.';
      } else if (!Number.isInteger(Number(roomsOccupied)) || Number(roomsOccupied) < 0) {
        next.rooms_occupied = 'Rooms occupied must be a whole number (0 or more).';
      }
      if (totalCollected.trim() === '') {
        next.total_rev = 'Enter the total collected today.';
      }
    } else {
      for (const field of REVENUE_FIELDS) {
        if (field.required && values[field.key].trim() === '') {
          next[field.key] = `Enter ${field.label.toLowerCase()} revenue (use 0 if none).`;
        }
      }
    }

    if (expenses.trim() === '') next.expenses = 'Enter expenses (use 0 if none).';
    if (cashHandedOver.trim() === '') next.cash_handed_over = 'Enter the cash handed over.';

    if (receiptFiles.length === 0) {
      next.receipt_photos = 'Attach at least one receipt photo.';
    } else if (receiptFiles.length > ATTACHMENT_LIMIT) {
      next.receipt_photos = `You can attach at most ${ATTACHMENT_LIMIT} files.`;
    }
    if (expenseFiles.length === 0) {
      next.expense_receipts = 'Attach at least one expense receipt.';
    } else if (expenseFiles.length > ATTACHMENT_LIMIT) {
      next.expense_receipts = `You can attach at most ${ATTACHMENT_LIMIT} files.`;
    }

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
    if (!validate()) return;

    const common = {
      report_date: date,
      expenses: parseMoney(expenses || '0'),
      cash_handed_over: parseMoney(cashHandedOver || '0'),
      comment: comment.trim() || null,
      business_type_ids: activeTypeIds,
      receipt_photos: receiptFiles,
      expense_receipts: expenseFiles,
      custom_values: customValues,
    };

    await onSubmit(
      isHostel
        ? {
            ...common,
            rooms_occupied: Number(roomsOccupied),
            amount_expected_semester: expectedSemesterValue ?? undefined,
            collected_so_far: collectedSoFarValue ?? undefined,
            total_rev: parseMoney(totalCollected || '0'),
          }
        : {
            ...common,
            rooms_rev: parseMoney(values.rooms_rev || '0'),
            bar_rev: parseMoney(values.bar_rev || '0'),
            food_rev: parseMoney(values.food_rev || '0'),
            sauna_rev: parseMoney(values.sauna_rev || '0'),
            other_rev: parseMoney(values.other_rev || '0'),
          },
    );
  };

  const uploadingCount = receiptFiles.length + expenseFiles.length;
  const uploadingSize = [...receiptFiles, ...expenseFiles].reduce((sum, f) => sum + f.size, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isHostel && (
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Semester Summary</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="amount_expected_semester" className="text-xs font-medium text-gray-500">
                Amount Expected This Semester
              </label>
              <input
                id="amount_expected_semester"
                inputMode="numeric"
                value={expectedInput}
                onChange={(e) => setExpectedOverride(formatMoney(e.target.value))}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-right text-lg font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="total_collected_today" className="text-xs font-medium text-gray-500">
                Money Collected Today
              </label>
              <input
                id="total_collected_today"
                inputMode="numeric"
                value={totalCollected}
                onChange={(e) => {
                  setTotalCollected(formatMoney(e.target.value));
                  setErrors((prev) => ({ ...prev, total_rev: '' }));
                }}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-right text-lg font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              {errors.total_rev && <p className="mt-1 text-xs text-red-600">{errors.total_rev}</p>}
            </div>
            <div>
              <label htmlFor="collected_so_far" className="text-xs font-medium text-gray-500">
                Money Collected So Far
              </label>
              <input
                id="collected_so_far"
                inputMode="numeric"
                value={soFarInput}
                onChange={(e) => setSoFarOverride(formatMoney(e.target.value))}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-right text-lg font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Balance Remaining</p>
              <p className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-right text-lg font-semibold text-blue-700">
                {balanceRemaining !== null ? formatCurrency(balanceRemaining) : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      <FormHero
        icon={Receipt}
        title={isHostel ? `${branchName} - Daily Report` : `${branchName} - Daily Sales`}
        description={
          isHostel
            ? `Daily operations report for ${branchName}. Please fill out all required fields accurately. * Indicates required question`
            : 'End of day sales report — submit once daily. * Indicates required question'
        }
      />

      <FormSection
        title="Report details"
        icon={CalendarDays}
        description="The day this report covers and who is submitting it."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Date" icon={CalendarDays} required error={errors.date}>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className={formInputClass}
            />
          </FormField>
          <FormField label="Manager Name" icon={User} required>
            <input
              type="text"
              value={managerName}
              readOnly
              className={`${formInputClass} bg-gray-50 text-gray-600`}
            />
          </FormField>
        </div>
      </FormSection>

      {isHostel ? (
        <FormSection
          title="Occupancy"
          icon={DoorOpen}
          description="Rooms occupied in this branch today."
        >
          <FormField label="Total Rooms Occupied" icon={DoorOpen} required error={errors.rooms_occupied}>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={roomsOccupied}
              onChange={(e) => {
                setRoomsOccupied(e.target.value);
                setErrors((prev) => ({ ...prev, rooms_occupied: '' }));
              }}
              placeholder="0"
              className={formInputClass}
            />
          </FormField>
        </FormSection>
      ) : (
        <FormSection
          title="Revenue"
          icon={CircleDollarSign}
          description="Enter the day's takings for each stream."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {REVENUE_FIELDS.map((field) => (
              <MoneyInput
                key={field.key}
                label={field.label}
                required={field.required}
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
      )}

      <FormSection
        title="Handover"
        icon={HandCoins}
        description="What was spent today and the cash physically handed over."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MoneyInput
            label="Expenses"
            required
            value={expenses}
            onChange={(e) => {
              setExpenses(formatMoney(e.target.value));
              setErrors((prev) => ({ ...prev, expenses: '' }));
            }}
            error={errors.expenses}
            placeholder="0"
          />
          <MoneyInput
            label="Cash Handed Over"
            required
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
              <Wallet className="h-4 w-4 text-emerald-600" /> Expected Cash (Amount Collected Today − Expenses)
            </span>
            <span className="text-2xl font-bold text-emerald-700">
              {formatCurrency(Math.max(total - parseMoney(expenses || '0'), 0))}
            </span>
          </div>
        )}
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

      <Button
        type="button"
        variant="outline"
        onClick={() => setFieldModalTypeId(defaultFieldTypeId === '' ? null : defaultFieldTypeId)}
      >
        <Plus className="mr-1.5 h-4 w-4" /> Add another field
      </Button>

      <FormSection
        title="Uploads"
        icon={ImageIcon}
        description="Both uploads are required. Add photos directly, a folder (zipped automatically) or a ready-made zip."
      >
        <UploadZone
          group="receipt"
          title={isHostel ? 'Receipt Photos' : 'Receipt Photo'}
          files={receiptFiles}
          previews={previews}
          error={errors.receipt_photos}
          onAdd={(files) => addFiles('receipt', files)}
          onRemove={(file) => removeFile('receipt', file)}
        />
        <UploadZone
          group="expense"
          title={isHostel ? 'Expense Receipt Photos' : 'Expense Receipt Photo'}
          files={expenseFiles}
          previews={previews}
          error={errors.expense_receipts}
          onAdd={(files) => addFiles('expense', files)}
          onRemove={(file) => removeFile('expense', file)}
        />
      </FormSection>

      <FormSection
        title="Comment"
        icon={MessageSquareText}
        description="Anything the office should know about today (optional)."
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Comment / Problem Faced Today</span>
          <textarea
            className={`${formTextareaClass} min-h-[100px]`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write any problem, e.g. power outage, guest issue, stock finished…"
            maxLength={2000}
          />
          {comment.length > 0 && <p className="text-xs text-gray-400">{comment.length}/2000</p>}
        </label>
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
                    ? `Uploading ${uploadingCount} file${uploadingCount === 1 ? '' : 's'} (${formatFileSize(uploadingSize)})`
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
            {submitting ? 'Submitting…' : 'Submit'}
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
