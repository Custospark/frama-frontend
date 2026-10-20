import { useState } from 'react';
import { Building2, Check, Copy, Link2, Phone, Plus, RefreshCw, KeyRound, Trash2, User } from 'lucide-react';
import { AdminShell } from '../../shared/components/layout/AdminShell';
import { Card } from '../../shared/components/cards/Card';
import { Button } from '../../shared/components/buttons/Button';
import { Badge } from '../../shared/components/badges/Badge';
import { Modal } from '../../shared/components/modals/Modal';
import { Table, type Column } from '../../shared/components/tables/Table';
import {
  FormField,
  FormFooter,
  FormHero,
  FormSection,
  formInputClass,
} from '../../shared/components/forms/formFields';
import { useAuth } from '../../app/contexts/useAuth';
import { useBranches, useCreateBranch, useDeleteBranch, useRegenerateCode, useUpdateBranch } from './AdminQueries';
import { useToast } from '../../app/contexts/useToast';
import { apiErrorMessage } from '../../shared/utils/apiErrorMessage';
import { branchShareUrl, copyToClipboard } from '../../shared/utils/shareLink';
import type { Branch } from '../../shared/types/models';

interface BranchForm {
  id?: number;
  branch_name: string;
  manager_name: string;
  phone: string;
  is_active: boolean;
}

const EMPTY_FORM: BranchForm = { branch_name: '', manager_name: '', phone: '', is_active: true };

export default function AdminBranchesPage() {
  const { showToast } = useToast();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('platform_admin');

  const { data: branches = [], isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const regenerate = useRegenerateCode();
  const deleteBranch = useDeleteBranch();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<BranchForm>(EMPTY_FORM);
  const [error, setError] = useState<string | undefined>();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Branch | null>(null);
  const updateBranch = useUpdateBranch(form.id ?? 0);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError(undefined);
    setFormOpen(true);
  };

  const openEdit = (branch: Branch) => {
    setForm({
      id: branch.id,
      branch_name: branch.branch_name,
      manager_name: branch.manager_name ?? '',
      phone: branch.phone ?? '',
      is_active: branch.is_active,
    });
    setError(undefined);
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError(undefined);
    if (!form.branch_name.trim()) {
      setError('Please enter a branch name.');
      return;
    }
    const payload = {
      branch_name: form.branch_name.trim(),
      manager_name: form.manager_name.trim() || null,
      phone: form.phone.trim() || null,
      is_active: form.is_active,
    };
    try {
      if (form.id) {
        await updateBranch.mutateAsync(payload);
        showToast('success', 'Branch updated.');
      } else {
        await createBranch.mutateAsync(payload);
        showToast('success', 'Branch created.');
      }
      setFormOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the branch.'));
    }
  };

  const handleRegenerate = async (branch: Branch) => {
    setRegeneratingId(branch.id);
    try {
      await regenerate.mutateAsync(branch.id);
      showToast('success', `New access code generated for ${branch.branch_name}.`);
    } catch (err) {
      showToast('error', apiErrorMessage(err, 'Could not regenerate the code.'));
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleCopy = async (branch: Branch) => {
    try {
      await navigator.clipboard.writeText(branch.code);
      setCopiedId(branch.id);
      showToast('success', 'Access code copied.');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('error', 'Could not copy the code.');
    }
  };

  const handleCopyLink = async (branch: Branch) => {
    if (!branch.slug) return;
    const ok = await copyToClipboard(branchShareUrl(branch.slug));
    if (ok) {
      setCopiedLinkId(branch.id);
      showToast('success', 'Branch link copied.');
      setTimeout(() => setCopiedLinkId(null), 2000);
    } else {
      showToast('error', 'Could not copy the link.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteBranch.mutateAsync(confirmDelete.id);
      showToast('success', `${confirmDelete.branch_name} deleted.`);
      setConfirmDelete(null);
    } catch (err) {
      showToast('error', apiErrorMessage(err, 'Could not delete the branch.'));
    }
  };

  const columns: Column<Branch>[] = [
    { key: 'branch_name', header: 'Branch', render: (b) => <span className="font-medium text-gray-900">{b.branch_name}</span> },
    { key: 'code', header: 'Access Code', render: (b) => <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{b.code}</code> },
    { key: 'manager_name', header: 'Manager', render: (b) => b.manager_name || '—' },
    { key: 'phone', header: 'Phone', render: (b) => b.phone || '—' },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (b) => (b.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (b) => (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleCopy(b)}>
            {copiedId === b.id ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
            Copy code
          </Button>
          {b.slug && (
            <Button variant="outline" size="sm" onClick={() => handleCopyLink(b)}>
              {copiedLinkId === b.id ? <Check className="mr-1 h-3.5 w-3.5" /> : <Link2 className="mr-1 h-3.5 w-3.5" />}
              Copy link
            </Button>
          )}
          {isAdmin && (
            <>
              <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => handleRegenerate(b)} loading={regeneratingId === b.id} disabled={regeneratingId !== null && regeneratingId !== b.id} title="Regenerate access code">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(b)} className="text-red-600" title="Delete branch">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
            <p className="mt-1 text-sm text-gray-500">Each branch manager signs in with the branch access code and their PIN.</p>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1.5 h-4 w-4" /> Add branch
            </Button>
          )}
        </div>

        <Card padding={false} className="p-0">
          <Table columns={columns} data={branches} loading={isLoading} rowKey={(b) => b.id} emptyMessage="No branches yet." />
        </Card>

        <p className="flex items-center gap-1.5 text-xs text-gray-400">
          <KeyRound className="h-3.5 w-3.5" /> Regenerating an access code instantly invalidates the old one. Share links use the branch slug.
        </p>
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? 'Edit branch' : 'Add branch'}
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
            icon={Building2}
            title={form.id ? 'Update branch' : 'New branch'}
            description="Managers sign in with the branch access code and their PIN."
          />

          <FormSection title="Branch details" icon={Building2} description="Name and contact information for this branch.">
            <FormField label="Branch name" icon={Building2} required>
              <input
                className={formInputClass}
                value={form.branch_name}
                onChange={(e) => setForm({ ...form, branch_name: e.target.value })}
                placeholder="e.g. Rubaga"
                autoFocus
              />
            </FormField>
            <FormField label="Manager name" icon={User}>
              <input
                className={formInputClass}
                value={form.manager_name}
                onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                placeholder="e.g. Jane Nakato"
              />
            </FormField>
            <FormField label="Phone" icon={Phone}>
              <input
                className={formInputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. +256 700 000 000"
              />
            </FormField>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Active
            </label>
          </FormSection>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormFooter>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createBranch.isPending || updateBranch.isPending}>
              <Check className="mr-1.5 h-4 w-4" />
              {form.id ? 'Save branch' : 'Add branch'}
            </Button>
          </FormFooter>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete branch"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteBranch.isPending}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Delete <span className="font-semibold text-gray-900">{confirmDelete?.branch_name}</span>? This cannot be undone.
        </p>
      </Modal>
    </AdminShell>
  );
}
