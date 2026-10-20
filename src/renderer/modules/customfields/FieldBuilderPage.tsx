import { useMemo, useState } from 'react';
import { LayoutList, Plus, Type } from 'lucide-react';
import { AdminShell } from '../../shared/components/layout/AdminShell';
import { Card } from '../../shared/components/cards/Card';
import { Button } from '../../shared/components/buttons/Button';
import { Badge } from '../../shared/components/badges/Badge';
import { Modal } from '../../shared/components/modals/Modal';
import { Table, type Column } from '../../shared/components/tables/Table';
import { useToast } from '../../app/contexts/useToast';
import { apiErrorMessage } from '../../shared/utils/apiErrorMessage';
import {
  useCustomFields,
  useDeleteCustomField,
} from '../customfields/CustomFieldQueries';
import { useBusinessTypes } from '../businesstypes/BusinessTypeQueries';
import { CustomFieldFormModal } from './CustomFieldFormModal';
import { TYPE_ICONS, TYPE_LABELS } from './customFieldMeta';
import type { CustomField, CustomFieldScope } from '../../shared/types/models';

export default function FieldBuilderPage() {
  const { showToast } = useToast();
  const { data: businessTypes = [] } = useBusinessTypes();

  const [scope, setScope] = useState<CustomFieldScope>('report');
  const [typeFilter, setTypeFilter] = useState<number | 'all'>('all');

  const { data: fields = [], isLoading } = useCustomFields(scope);
  const deleteField = useDeleteCustomField();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomField | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CustomField | null>(null);

  const filtered = useMemo(
    () => fields.filter((f) => typeFilter === 'all' || f.business_type_id === typeFilter),
    [fields, typeFilter],
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (field: CustomField) => {
    setEditing(field);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteField.mutateAsync(confirmDelete.id);
      showToast('success', 'Field removed.');
      setConfirmDelete(null);
    } catch (err) {
      showToast('error', apiErrorMessage(err, 'Could not remove the field.'));
    }
  };

  const columns: Column<CustomField>[] = [
    {
      key: 'label',
      header: 'Field',
      render: (f) => {
        const Icon = TYPE_ICONS[f.type] ?? Type;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">{f.label}</p>
              <p className="text-xs text-gray-400">{f.key}</p>
            </div>
          </div>
        );
      },
    },
    { key: 'type', header: 'Type', render: (f) => <Badge variant="neutral">{TYPE_LABELS[f.type]}</Badge> },
    {
      key: 'business_type',
      header: 'Business Type',
      render: (f) => <Badge variant="primary">{f.business_type?.name ?? 'General'}</Badge>,
    },
    {
      key: 'is_required',
      header: 'Required',
      align: 'center',
      render: (f) => (f.is_required ? <Badge variant="success">Yes</Badge> : <span className="text-gray-400">No</span>),
    },
    {
      key: 'is_active',
      header: 'Status',
      align: 'center',
      render: (f) => (f.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Hidden</Badge>),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (f) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(f)}>Edit</Button>
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setConfirmDelete(f)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Report Fields</h1>
            <p className="text-sm text-gray-500">
              Add custom fields managers fill in each day, grouped by business type.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Add field
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {(['report', 'asset'] as CustomFieldScope[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  scope === s ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {s === 'report' ? 'Daily Reports' : 'Assets'}
              </button>
            ))}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All business types</option>
            {businessTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {!isLoading && filtered.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 py-10 text-center">
            <LayoutList className="h-6 w-6 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">No fields defined yet</p>
            <p className="text-sm text-gray-500">Add a field to start collecting richer branch data.</p>
            <Button className="mt-2" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" /> Add your first field
            </Button>
          </Card>
        ) : (
          <Card padding={false} className="p-0">
            <Table columns={columns} data={filtered} loading={isLoading} rowKey={(f) => f.id} emptyMessage="No fields yet." />
          </Card>
        )}
      </div>

      <CustomFieldFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        defaultScope={scope}
        defaultBusinessTypeId={typeFilter === 'all' ? '' : typeFilter}
        businessTypes={businessTypes}
      />

      <Modal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Remove field"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteField.isPending}>Remove</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Remove <span className="font-semibold text-gray-900">{confirmDelete?.label}</span>? Existing submissions keep their values.
        </p>
      </Modal>
    </AdminShell>
  );
}
