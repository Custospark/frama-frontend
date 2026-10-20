import { useState } from 'react';
import { Building2, Check, KeyRound, Lock, Plus, Shield, User, Users } from 'lucide-react';
import { AdminShell } from '../../shared/components/layout/AdminShell';
import { Card } from '../../shared/components/cards/Card';
import { Button } from '../../shared/components/buttons/Button';
import { Input } from '../../shared/components/inputs/Input';
import { Badge } from '../../shared/components/badges/Badge';
import { Modal } from '../../shared/components/modals/Modal';
import { Table, type Column } from '../../shared/components/tables/Table';
import {
  FormField,
  FormFooter,
  FormHero,
  FormSection,
  formInputClass,
  formSelectClass,
} from '../../shared/components/forms/formFields';
import {
  useBranches,
  useCreateUser,
  useResetPin,
  useUpdateUser,
  useUsers,
  type UserPayload,
} from './AdminQueries';
import { useToast } from '../../app/contexts/useToast';
import { apiErrorMessage } from '../../shared/utils/apiErrorMessage';
import { formatDateTime } from '../../shared/utils/formatDateTime';
import type { AuthUser, UserRole } from '../../shared/types/models';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'manager', label: 'Manager' },
  { value: 'executive', label: 'Executive' },
  { value: 'platform_admin', label: 'Platform Admin' },
];

const ROLE_BADGE: Record<UserRole, 'primary' | 'success' | 'warning'> = {
  manager: 'primary',
  executive: 'success',
  platform_admin: 'warning',
};

interface UserForm {
  id?: number;
  name: string;
  role: UserRole;
  branch_id: string;
  pin: string;
}

const EMPTY_FORM: UserForm = { name: '', role: 'manager', branch_id: '', pin: '' };

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const { data: users = [], isLoading } = useUsers();
  const { data: branches = [] } = useBranches();
  const createUser = useCreateUser();
  const resetPin = useResetPin();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [error, setError] = useState<string | undefined>();
  const updateUser = useUpdateUser(form.id ?? 0);

  const [resetTarget, setResetTarget] = useState<AuthUser | null>(null);
  const [resetPinValue, setResetPinValue] = useState('');

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError(undefined);
    setFormOpen(true);
  };

  const openEdit = (u: AuthUser) => {
    setForm({
      id: u.id,
      name: u.name,
      role: u.role,
      branch_id: u.branch_id ? String(u.branch_id) : '',
      pin: '',
    });
    setError(undefined);
    setFormOpen(true);
  };

  const handleSave = async () => {
    setError(undefined);
    if (!form.name.trim()) {
      setError('Please enter a name.');
      return;
    }
    if (form.role === 'manager' && !form.branch_id) {
      setError('Managers must be assigned to a branch.');
      return;
    }
    if (!form.id && form.pin.length < 4) {
      setError('A PIN of at least 4 digits is required for new users.');
      return;
    }
    const payload: UserPayload = {
      name: form.name.trim(),
      role: form.role,
      branch_id: form.role === 'manager' ? Number(form.branch_id) : null,
      ...(form.pin ? { pin: form.pin } : {}),
    };
    try {
      if (form.id) {
        await updateUser.mutateAsync(payload);
        showToast('success', 'User updated.');
      } else {
        await createUser.mutateAsync(payload);
        showToast('success', 'User created.');
      }
      setFormOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the user.'));
    }
  };

  const handleResetPin = async () => {
    if (!resetTarget) return;
    if (resetPinValue.length < 4) {
      showToast('error', 'PIN must be at least 4 digits.');
      return;
    }
    try {
      await resetPin.mutateAsync({ id: resetTarget.id, pin: resetPinValue });
      showToast('success', `PIN reset for ${resetTarget.name}.`);
      setResetTarget(null);
      setResetPinValue('');
    } catch (err) {
      showToast('error', apiErrorMessage(err, 'Could not reset the PIN.'));
    }
  };

  const columns: Column<AuthUser>[] = [
    { key: 'name', header: 'Name', render: (u) => <span className="font-medium text-gray-900">{u.name}</span> },
    { key: 'role', header: 'Role', render: (u) => <Badge variant={ROLE_BADGE[u.role]}>{ROLE_OPTIONS.find((r) => r.value === u.role)?.label ?? u.role}</Badge> },
    { key: 'branch', header: 'Branch', render: (u) => u.branch?.branch_name ?? '—' },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (u) => (u.is_active ? <Badge variant="success">Active</Badge> : <Badge variant="neutral">Inactive</Badge>),
    },
    { key: 'last_login_at', header: 'Last Login', render: (u) => formatDateTime(u.last_login_at) },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>Edit</Button>
          <Button variant="outline" size="sm" onClick={() => setResetTarget(u)}>
            <KeyRound className="mr-1 h-3.5 w-3.5" /> Reset PIN
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Users &amp; PINs</h1>
            <p className="text-sm text-gray-500">Manage managers, executives and platform admins.</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" /> Add user
          </Button>
        </div>

        <Card padding={false} className="p-0">
          <Table
            columns={columns}
            data={users}
            loading={isLoading}
            rowKey={(u) => u.id}
            emptyMessage="No users yet."
          />
        </Card>
      </div>

      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={form.id ? 'Edit user' : 'Add user'}
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
            icon={Users}
            title={form.id ? 'Update user' : 'New user'}
            description="Managers are bound to a branch; executives and admins see every branch."
          />

          <FormSection title="Account" icon={User} description="Who this person is and what they can access.">
            <FormField label="Full name" icon={User} required>
              <input
                className={formInputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Jane Nakato"
                autoFocus
              />
            </FormField>

            <FormField label="Role" icon={Shield} required>
              <select
                className={formSelectClass}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormField>

            {form.role === 'manager' && (
              <FormField label="Branch" icon={Building2} required>
                <select
                  className={formSelectClass}
                  value={form.branch_id}
                  onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                >
                  <option value="">Select a branch…</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.branch_name}</option>
                  ))}
                </select>
              </FormField>
            )}
          </FormSection>

          <FormSection title="Security" icon={Lock} description="The PIN used to sign in.">
            <FormField
              label={form.id ? 'New PIN' : 'PIN'}
              icon={Lock}
              required={!form.id}
              hint={form.id ? 'Leave blank to keep the current PIN.' : 'Between 4 and 6 digits.'}
            >
              <input
                className={formInputClass}
                value={form.pin}
                inputMode="numeric"
                maxLength={6}
                onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder="••••"
              />
            </FormField>
          </FormSection>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <FormFooter>
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createUser.isPending || updateUser.isPending}>
              <Check className="mr-1.5 h-4 w-4" />
              {form.id ? 'Save user' : 'Add user'}
            </Button>
          </FormFooter>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(resetTarget)}
        onClose={() => { setResetTarget(null); setResetPinValue(''); }}
        title="Reset PIN"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setResetTarget(null); setResetPinValue(''); }}>Cancel</Button>
            <Button onClick={handleResetPin} loading={resetPin.isPending}>
              <Users className="mr-1.5 h-4 w-4" /> Reset
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Set a new PIN for <span className="font-semibold text-gray-900">{resetTarget?.name}</span>.
          </p>
          <Input
            label="New PIN (4-6 digits)"
            value={resetPinValue}
            inputMode="numeric"
            maxLength={6}
            onChange={(e) => setResetPinValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••"
          />
        </div>
      </Modal>
    </AdminShell>
  );
}
