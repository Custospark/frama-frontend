import { useState } from 'react';
import { Boxes, Building2, Check, DollarSign, Pencil, Plus, Tag, Trash2, Type } from 'lucide-react';
import { AdminShell } from '../../shared/components/layout/AdminShell';
import { Button } from '../../shared/components/buttons/Button';
import { Badge } from '../../shared/components/badges/Badge';
import { Modal } from '../../shared/components/modals/Modal';
import { Table, type Column } from '../../shared/components/tables/Table';
import { EmptyState } from '../../shared/components/cards/EmptyState';
import {
  FormField,
  FormFooter,
  FormHero,
  FormSection,
  formInputClass,
  formSelectClass,
} from '../../shared/components/forms/formFields';
import { DynamicFieldGroup } from '../../shared/components/dynamicfields/DynamicFieldGroup';
import { useToast } from '../../app/contexts/useToast';
import { useAuth } from '../../app/contexts/useAuth';
import { apiErrorMessage } from '../../shared/utils/apiErrorMessage';
import { formatCurrency } from '../../shared/utils/formatCurrency';
import { parseMoney, formatMoney } from '../../shared/utils/moneyInput';
import {
  useAssets,
  useCreateAsset,
  useDeleteAsset,
  useUpdateAsset,
  type AssetPayload,
} from './AssetQueries';
import { useBusinessTypes } from '../businesstypes/BusinessTypeQueries';
import { useCustomFields } from '../customfields/CustomFieldQueries';
import type { Asset, CustomValues } from '../../shared/types/models';

interface FormState {
  id?: number;
  business_type_id: number | '';
  name: string;
  unit_price: string;
  is_active: boolean;
}

const EMPTY_FORM: FormState = { business_type_id: '', name: '', unit_price: '', is_active: true };

export default function AssetsPage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { data: assets = [], isLoading } = useAssets();
  const { data: businessTypes = [] } = useBusinessTypes(true);
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [customValues, setCustomValues] = useState<CustomValues>({});
  const [error, setError] = useState<string | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<Asset | null>(null);

  const { data: assetFields = [] } = useCustomFields(
    'asset',
    form.business_type_id === '' ? null : Number(form.business_type_id),
  );

  const setCustomValue = (key: string, value: unknown) => {
    setCustomValues((prev) => ({ ...prev, [key]: value as CustomValues[string] }));
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, business_type_id: businessTypes[0]?.id ?? '' });
    setCustomValues({});
    setError(undefined);
    setOpen(true);
  };

  const openEdit = (asset: Asset) => {
    setForm({
      id: asset.id,
      business_type_id: asset.business_type_id ?? '',
      name: asset.name,
      unit_price: asset.unit_price ? formatMoney(String(asset.unit_price)) : '',
      is_active: asset.is_active,
    });
    setCustomValues(asset.custom_values ?? {});
    setError(undefined);
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (form.business_type_id === '') {
      setError('Please choose a business type.');
      return;
    }
    if (!form.name.trim()) {
      setError('Please enter an asset name.');
      return;
    }
    const payload: AssetPayload = {
      business_type_id: Number(form.business_type_id),
      name: form.name.trim(),
      unit_price: form.unit_price ? parseMoney(form.unit_price) : null,
      is_active: form.is_active,
      custom_values: customValues,
    };
    try {
      if (form.id) {
        await updateAsset.mutateAsync({ id: form.id, ...payload });
        showToast('success', 'Asset updated.');
      } else {
        await createAsset.mutateAsync(payload);
        showToast('success', 'Asset added.');
      }
      setOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the asset. Please try again.'));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAsset.mutateAsync(confirmDelete.id);
      showToast('success', 'Asset removed.');
      setConfirmDelete(null);
    } catch (err) {
      showToast('error', apiErrorMessage(err, 'Could not remove the asset.'));
    }
  };

  const columns: Column<Asset>[] = [
    { key: 'name', header: 'Name', render: (a) => <span className="font-medium text-gray-900">{a.name}</span> },
    { key: 'type', header: 'Type', render: (a) => <Badge variant="primary">{a.business_type?.name ?? '—'}</Badge> },
    {
      key: 'unit_price',
      header: 'Unit Price',
      align: 'right',
      render: (a) => (a.unit_price !== null ? formatCurrency(a.unit_price) : <span className="text-gray-400">—</span>),
    },
    {
      key: 'is_active',
      header: 'Status',
      align: 'center',
      render: (a) => (a.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (a) => (
        <div className="flex justify-end gap-1">
          <button type="button" onClick={() => openEdit(a)} className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-blue-600" aria-label="Edit asset">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setConfirmDelete(a)} className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600" aria-label="Delete asset">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Branch Assets</h1>
            <p className="text-sm text-gray-500">
              Rooms, hostels, saunas and motels{user?.branch ? ` · ${user.branch.branch_name}` : ''}
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Asset
          </Button>
        </div>

        {!isLoading && assets.length === 0 ? (
          <EmptyState
            icon={<Boxes className="h-6 w-6" />}
            title="No assets yet"
            description="Add the rooms, hostels, saunas and motels that belong to your branch."
            action={<Button onClick={openCreate}><Plus className="mr-1.5 h-4 w-4" /> Add your first asset</Button>}
          />
        ) : (
          <Table columns={columns} data={assets} loading={isLoading} rowKey={(a) => a.id} emptyMessage="No assets yet." />
        )}
      </div>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'Edit asset' : 'Add asset'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <FormHero
            icon={Boxes}
            title={form.id ? 'Update asset' : 'New asset'}
            description="Units that belong to your branch, grouped by business type."
          />

          <FormSection title="Asset details" icon={Tag} description="What this unit is and what it costs.">
            <FormField label="Business type" icon={Building2} required>
              <select
                className={formSelectClass}
                value={form.business_type_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, business_type_id: e.target.value === '' ? '' : Number(e.target.value) }))
                }
              >
                <option value="" disabled>Select a business type</option>
                {businessTypes.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Name" icon={Type} required>
              <input
                className={formInputClass}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Room 12, Executive Sauna"
              />
            </FormField>

            <FormField label="Unit price" icon={DollarSign} hint="Optional price per night or session.">
              <input
                className={formInputClass}
                value={form.unit_price}
                inputMode="decimal"
                onChange={(e) => setForm((f) => ({ ...f, unit_price: formatMoney(e.target.value) }))}
                placeholder="0"
              />
            </FormField>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Active
            </label>
          </FormSection>

          {assetFields.length > 0 && (
            <FormSection title="Extra details" icon={Tag} description="Fields defined for this business type.">
              <DynamicFieldGroup fields={assetFields} values={customValues} onChange={setCustomValue} />
            </FormSection>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormFooter>
            <Button variant="outline" onClick={() => setOpen(false)} type="button">Cancel</Button>
            <Button type="submit" loading={createAsset.isPending || updateAsset.isPending}>
              <Check className="mr-1.5 h-4 w-4" />
              {form.id ? 'Save asset' : 'Add asset'}
            </Button>
          </FormFooter>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Remove asset"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)} type="button">Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteAsset.isPending}>Remove</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Remove <span className="font-semibold text-gray-900">{confirmDelete?.name}</span> from this branch? This cannot be undone.
        </p>
      </Modal>
    </AdminShell>
  );
}
