import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BedDouble,
  CheckCircle2,
  Clock,
  DoorOpen,
  Eye,
  Flame,
  HandCoins,
  Pencil,
  Plus,
  Target,
  Upload,
  UtensilsCrossed,
  Wallet,
  Wine,
} from 'lucide-react';
import { AdminShell } from '../../shared/components/layout/AdminShell';
import { DashboardStatCard } from '../../shared/components/cards/DashboardStatCard';
import type { CardColor } from '../../shared/components/cards/statCardStyles';
import { Button } from '../../shared/components/buttons/Button';
import { Badge } from '../../shared/components/badges/Badge';
import { Card } from '../../shared/components/cards/Card';
import { Modal } from '../../shared/components/modals/Modal';
import { Table, type Column } from '../../shared/components/tables/Table';
import { RevenueTrendChart } from '../admin/DashboardCharts';
import { RevenueMixChart, type RevenueMixSlice } from './ManagerCharts';
import { ReportDetails } from './ReportDetails';
import { ShareBranchLinkButton } from '../share/ShareBranchLinkButton';
import { useAuth } from '../../app/contexts/useAuth';
import { useMyReports } from '../report/ReportQueries';
import { formatCurrency } from '../../shared/utils/formatCurrency';
import { formatDate, formatDateTime, todayISO } from '../../shared/utils/formatDateTime';
import { ROUTES } from '../../app/routes/constants/shared.paths';
import type { Report } from '../../shared/types/models';

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: reports = [], isLoading } = useMyReports({ per_page: 100 });
  const [viewing, setViewing] = useState<Report | null>(null);

  const today = todayISO();
  const todayReport = reports.find((r) => r.report_date === today) ?? null;
  const isHostel = user?.branch?.business_type?.slug === 'hostel';
  const branchName = user?.branch?.branch_name ?? 'Your branch';

  const stats = useMemo(() => {
    const dayTotal = todayReport?.total_rev ?? 0;
    const month = reports
      .filter((r) => r.report_date.slice(0, 7) === today.slice(0, 7))
      .reduce((sum, r) => sum + r.total_rev, 0);
    return { dayTotal, month };
  }, [reports, todayReport, today]);

  const semester = useMemo(() => {
    const latest = reports.find(
      (r) => r.amount_expected_semester !== null || r.collected_so_far !== null,
    );
    const expected = latest?.amount_expected_semester ?? null;
    const soFar = latest?.collected_so_far ?? null;
    const balance = expected !== null ? expected - (soFar ?? 0) : null;
    const progress = expected !== null && expected > 0 ? Math.min(100, ((soFar ?? 0) / expected) * 100) : 0;
    return { expected, soFar, balance, progress };
  }, [reports]);

  const trend = useMemo(
    () =>
      [...reports]
        .sort((a, b) => a.report_date.localeCompare(b.report_date))
        .slice(-14)
        .map((r) => ({ date: r.report_date, total: r.total_rev })),
    [reports],
  );

  const mix: RevenueMixSlice[] = [
    { name: 'Rooms', value: todayReport?.rooms_rev ?? 0, fill: '#3b82f6' },
    { name: 'Bar', value: todayReport?.bar_rev ?? 0, fill: '#06b6d4' },
    { name: 'Food', value: todayReport?.food_rev ?? 0, fill: '#10b981' },
    { name: 'Sauna', value: todayReport?.sauna_rev ?? 0, fill: '#f59e0b' },
    { name: 'Other', value: todayReport?.other_rev ?? 0, fill: '#8b5cf6' },
  ];

  const tiles: { label: string; value: string; icon: typeof Wallet; color: CardColor; badge: string }[] = isHostel
    ? [
        { label: "Today's Total", value: formatCurrency(stats.dayTotal), icon: Wallet, color: 'blue', badge: 'Today' },
        { label: 'This Month', value: formatCurrency(stats.month), icon: CheckCircle2, color: 'green', badge: 'Month' },
        {
          label: 'Rooms Occupied',
          value: todayReport ? String(todayReport.rooms_occupied ?? 0) : '—',
          icon: DoorOpen,
          color: 'indigo',
          badge: 'Rooms',
        },
        {
          label: 'Expected This Semester',
          value: semester.expected !== null ? formatCurrency(semester.expected) : '—',
          icon: Target,
          color: 'amber',
          badge: 'Target',
        },
        {
          label: 'Collected So Far',
          value: semester.soFar !== null ? formatCurrency(semester.soFar) : '—',
          icon: HandCoins,
          color: 'green',
          badge: 'Semester',
        },
        {
          label: 'Balance Remaining',
          value: semester.balance !== null ? formatCurrency(semester.balance) : '—',
          icon: Wallet,
          color: 'purple',
          badge: 'Semester',
        },
      ]
    : [
        { label: "Today's Total", value: formatCurrency(stats.dayTotal), icon: Wallet, color: 'blue', badge: 'Today' },
        { label: 'This Month', value: formatCurrency(stats.month), icon: CheckCircle2, color: 'green', badge: 'Month' },
        { label: 'Rooms', value: formatCurrency(todayReport?.rooms_rev ?? 0), icon: BedDouble, color: 'indigo', badge: 'Rooms' },
        { label: 'Bar', value: formatCurrency(todayReport?.bar_rev ?? 0), icon: Wine, color: 'amber', badge: 'Bar' },
        { label: 'Food', value: formatCurrency(todayReport?.food_rev ?? 0), icon: UtensilsCrossed, color: 'green', badge: 'Food' },
        { label: 'Sauna', value: formatCurrency(todayReport?.sauna_rev ?? 0), icon: Flame, color: 'purple', badge: 'Sauna' },
      ];

  const reportColumns: Column<Report>[] = [
    {
      key: 'report_date',
      header: 'Date',
      render: (report) => (
        <div>
          <p className="font-medium text-gray-900">{formatDate(report.report_date)}</p>
          <p className="text-xs text-gray-400">{formatDateTime(report.submitted_at)}</p>
        </div>
      ),
    },
    {
      key: 'total_rev',
      header: 'Collected',
      align: 'right',
      render: (report) => (
        <span className="font-semibold text-blue-700">{formatCurrency(report.total_rev)}</span>
      ),
    },
    {
      key: 'expenses',
      header: 'Expenses',
      align: 'right',
      render: (report) => formatCurrency(report.expenses),
    },
    {
      key: 'cash_handed_over',
      header: 'Cash Handed Over',
      align: 'right',
      render: (report) => formatCurrency(report.cash_handed_over),
    },
    {
      key: 'attachments_count',
      header: 'Files',
      align: 'center',
      render: (report) => (report.receipt_photos?.length ?? 0) + (report.expense_receipts?.length ?? 0),
    },
    {
      key: 'status',
      header: 'Status',
      render: (report) =>
        report.allow_edit ? (
          <Badge variant="warning">Editable</Badge>
        ) : (
          <Badge variant="success">Submitted</Badge>
        ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (report) => (
        <div className="flex items-center justify-end gap-2">
          {report.allow_edit && (
            <Button
              size="sm"
              onClick={() => navigate(`${ROUTES.MANAGER.NEW_REPORT}?date=${report.report_date}`)}
            >
              <Pencil className="mr-1.5 h-4 w-4" /> Edit
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setViewing(report)}>
            <Eye className="mr-1.5 h-4 w-4" /> View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.branch?.branch_name ?? 'Your'} Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">{formatDate(today)}</p>
          </div>
          <div className="flex items-center gap-3">
            {todayReport ? (
              <Badge variant="success">Submitted today</Badge>
            ) : (
              <Badge variant="warning">
                <Clock className="mr-1 h-3 w-3" /> Pending today
              </Badge>
            )}
            <Button size="sm" onClick={() => navigate(ROUTES.MANAGER.NEW_REPORT)}>
              <Plus className="h-4 w-4" /> Submit Report
            </Button>
          </div>
        </div>

        {!todayReport && !isLoading && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Upload className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Today&apos;s report is not uploaded yet</p>
                <p className="text-xs text-gray-500">
                  {isHostel
                    ? "Enter the day's collection and attach the handover receipt photo."
                    : "Enter the day's revenue and attach the handover receipt photo."}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate(ROUTES.MANAGER.NEW_REPORT)}>
              <Upload className="h-4 w-4" /> Upload Report
            </Button>
          </div>
        )}

        <ShareBranchLinkButton branch={user?.branch} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {tiles.map(({ label, value, icon: Icon, color, badge }) => (
            <DashboardStatCard key={label} label={label} value={value} icon={Icon} color={color} badge={badge} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <RevenueTrendChart
              data={trend}
              title={isHostel ? 'Collection Trend' : 'Revenue Trend'}
              scopeLabel={`${branchName} only`}
              valueLabel={isHostel ? 'Total collected' : 'Total revenue'}
            />
          </div>
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="h-64 flex items-center justify-center text-sm text-gray-400">Loading…</div>
              </div>
            ) : isHostel ? (
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900">Semester Progress</h3>
                <p className="mt-1 text-xs text-gray-500">Collected so far against the semester target.</p>
                <div className="mt-8">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Collected</span>
                    <span className="font-semibold text-gray-900">
                      {semester.soFar !== null ? formatCurrency(semester.soFar) : '—'}
                    </span>
                  </div>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${semester.progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{semester.progress.toFixed(0)}% of target</span>
                    <span>{semester.expected !== null ? formatCurrency(semester.expected) : '—'}</span>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                    <span className="text-gray-500">Balance remaining</span>
                    <span className="font-semibold text-gray-900">
                      {semester.balance !== null ? formatCurrency(semester.balance) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <RevenueMixChart data={mix} />
            )}
          </div>
        </div>

        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">My submitted reports</p>
              <p className="text-xs text-gray-500">Open any report to see everything you submitted.</p>
            </div>
            <Button size="sm" onClick={() => navigate(ROUTES.MANAGER.NEW_REPORT)}>
              <Plus className="h-4 w-4" /> Submit Report
            </Button>
          </div>
          <Table
            columns={reportColumns}
            data={reports}
            loading={isLoading}
            rowKey={(report) => report.id}
            onRowClick={(report) => setViewing(report)}
            emptyMessage="No reports submitted yet."
          />
        </Card>

        <div className="flex justify-end">
          <Link to={ROUTES.MANAGER.NEW_REPORT} className="text-xs font-medium text-blue-600 hover:underline">
            Manage reports
          </Link>
        </div>

        <Modal
          isOpen={viewing !== null}
          onClose={() => setViewing(null)}
          title={viewing ? `${formatDate(viewing.report_date)} · ${formatCurrency(viewing.total_rev)}` : undefined}
          size="lg"
          footer={
            <Button variant="outline" size="sm" onClick={() => setViewing(null)}>
              Close
            </Button>
          }
        >
          {viewing && <ReportDetails report={viewing} showMeta />}
        </Modal>
      </div>
    </AdminShell>
  );
}
