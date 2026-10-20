import { useState } from 'react';
import { Plus, Tags } from 'lucide-react';
import { AdminShell } from '../../shared/components/layout/AdminShell';
import { Card } from '../../shared/components/cards/Card';
import { Button } from '../../shared/components/buttons/Button';
import { Input } from '../../shared/components/inputs/Input';
import { Badge } from '../../shared/components/badges/Badge';
import { Modal } from '../../shared/components/modals/Modal';
import { Table, type Column } from '../../shared/components/tables/Table';
import { useToast } from '../../app/contexts/useToast';
import { useAuth } from '../../app/contexts/useAuth';
import { apiErrorMessage } from '../../shared/utils/apiErrorMessage';
import {
  useBusinessTypes,
  useCreateBusinessType,
  useDeleteBusinessType,
  useUpdateBusinessType,
} from '../businesstypes/BusinessTypeQueries';
import type { BusinessType } from '../../shared/types/models';

interface FormState {
  id?: number;
  name: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

const EMPTY_FORM: FormState = { name: '', icon: '', is_active: true, sort_order: 0 };

export default function AdminBusinessTypesPage() {
  const { showToast } = useToast();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('platform_admin');

  const { data: businessTypes = [], isLoading } = useBusinessTypes();
  const createType = useCreateBusinessType();
  const updateType = useUpdateBusinessType();
  const deleteType = useDeleteBusinessType();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<BusinessType | null>(null);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError(undefined);
    setFormOpen(true);
  };

  const openEdit = (type: BusinessType) => {
    setForm({
      id: type.id,
      name: type.name,
      icon: type.icon ?? '',
      is_active: type.is_active,
      sort_order: type.sort_order,
    });
    setError(undefined);
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError(undefined);
    if (!form.name.trim()) {
      setError('Please enter a business type name.');
      return;
    }
    const payload = {
      name: form.name.trim(),
      icon: form.icon.trim() || null,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };
    try {
      if (form.id) {
        await updateType.mutateAsync({ id: form.id, ...payload });
        showToast('success', 'Business type updated.');
      } else {
        await createType.mutateAsync(payload);
        showToast('success', 'Business type created.');
      }
      setFormOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the business type.'));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteType.mutateAsync(confirmDelete.id);
      showToast('success', 'Business type removed.');
      setConfirmDelete(null);
    } catch (err) {
      showToast('error', apiErrorMessage(err, 'Could not remove the business type.'));
    }
  };

  const columns: Column<BusinessType>[] = [
    { key: 'name', header: 'Business Type', render: (t) => <span className="font-medium text-gray-900">{t.name}</span> },
    { key: 'slug', header: 'Slug', render: (t) => <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{t.slug}</code> },
    { key: 'assets_count', header: 'Assets', align: 'center', render: (t) => t.assets_count ?? 0 },
    { key: 'custom_fields_count', header: 'Fields', align: 'center', render: (t) => t.custom_fields_count ?? 0 },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (t) => (t.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (t) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>Edit</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(t)} className="text-red-600">Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Business Types</h1>
            <p className="text-sm text-gray-500">
              Rooms, hostels, saunas and motels are provided by default. Add more to match your branches.
            </p>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" /> Add business type
            </Button>
          )}
        </div>

        {!isLoading && businessTypes.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-10 text-center">
            <Tags className="h-6 w-6 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">No business types yet</p>
            <p className="text-sm text-gray-500">Create a business type to start defining its report fields.</p>
          </Card>
        ) : (
          <Card padding={false} className="p-0">
            <Table columns={columns} data={businessTypes} loading={isLoading} rowKey={(t) => t.id} emptyMessage="No business types yet." />
          </Card>
        )}
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? 'Edit business type' : 'Add business type'}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={createType.isPending || updateType.isPending}>
              {form.id ? 'Save changes' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Conference Hall" />
          <Input label="Icon (optional)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. building" />
          <Input
            label="Sort order"
            type="number"
            value={String(form.sort_order)}
            onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Active
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Remove business type"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteType.isPending}>Remove</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Remove <span className="font-semibold text-gray-900">{confirmDelete?.name}</span>? Its custom fields will also be removed. This cannot be undone.
        </p>
      </Modal>
    </AdminShell>
  );
}
