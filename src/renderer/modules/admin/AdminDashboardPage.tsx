import { useState } from 'react';
import { CheckCheck, CheckCircle2, Circle, Download, RefreshCw } from 'lucide-react';
import { AdminShell } from '../../shared/components/layout/AdminShell';
import { Card } from '../../shared/components/cards/Card';
import { Button } from '../../shared/components/buttons/Button';
import { Table, type Column } from '../../shared/components/tables/Table';
import { Input } from '../../shared/components/inputs/Input';
import { StatTiles } from './StatTiles';
import { RevenueByBranchChart, RevenueTrendChart } from './DashboardCharts';
import { useBranches, useDashboardSummary, useDashboardTrend, useDownloadReportExport } from './AdminQueries';
import { formatCurrency } from '../../shared/utils/formatCurrency';
import { formatDate, toISODate } from '../../shared/utils/formatDateTime';
import { useToast } from '../../app/contexts/useToast';
import type { DashboardRow } from '../../shared/types/models';

/** Compact table figure: 350k / 1.4M / — (matches the client's dashboard mock). */
function compact(value: number): string {
  if (!value) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('en-UG', { maximumFractionDigits: 1 })}M`;
  }
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
  return value.toLocaleString('en-UG');
}

/** 2025-10-19 -> 19/10/2025 */
function slashDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default function AdminDashboardPage() {
  const { showToast } = useToast();
  const today = toISODate(new Date());
  const [date, setDate] = useState(today);
  const [branchId, setBranchId] = useState<number | 'all'>('all');

  const { data, isLoading, isFetching, refetch } = useDashboardSummary(date);
  const { data: branches = [] } = useBranches();
  const [trendFrom] = useState(() => toISODate(new Date(Date.now() - 13 * 86400000)));
  const { data: trend = [] } = useDashboardTrend(trendFrom, today);
  const exportMutation = useDownloadReportExport({
    from: date,
    to: date,
    branchId: branchId === 'all' ? undefined : branchId,
  });

  const allRows = data?.rows ?? [];
  const rows = branchId === 'all' ? allRows : allRows.filter((r) => r.branch_id === branchId);

  const totals = rows.reduce(
    (acc, r) => ({
      rooms: acc.rooms + r.rooms_rev,
      bar: acc.bar + r.bar_rev,
      food: acc.food + r.food_rev,
      sauna: acc.sauna + r.sauna_rev,
      other: acc.other + (r.other_rev ?? 0),
      total: acc.total + r.total_rev,
      expenses: acc.expenses + (r.expenses ?? 0),
      cash: acc.cash + (r.cash_handed_over ?? 0),
    }),
    { rooms: 0, bar: 0, food: 0, sauna: 0, other: 0, total: 0, expenses: 0, cash: 0 },
  );

  const chartData = rows.map((r) => ({
    name: r.branch_name,
    rooms: r.rooms_rev,
    bar: r.bar_rev,
    food: r.food_rev,
    sauna: r.sauna_rev,
    other: r.other_rev ?? 0,
  }));

  const branchCount = allRows.length;
  const submittedCount = data?.submitted_count ?? 0;
  const allSubmitted = branchCount > 0 && submittedCount >= branchCount;

  const customMeta = data?.custom_fields ?? [];
  const customTotals = data?.custom_grand_totals ?? {};

  const handleExport = async () => {
    try {
      const blob = await exportMutation.mutateAsync();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frama-reports-${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('success', 'Export downloaded.');
    } catch {
      showToast('error', 'Export failed. Please try again.');
    }
  };

  const categoryCell = (r: DashboardRow, value: number) =>
    r.business_type === 'hostel' ? (
      <span className="text-gray-300">—</span>
    ) : (
      compact(value)
    );

  const columns: Column<DashboardRow>[] = [
    { key: 'date', header: 'Date', render: (r) => slashDate(r.date) },
    {
      key: 'branch_name',
      header: 'Branch',
      render: (r) => <span className="font-medium text-gray-900">{r.branch_name}</span>,
    },
    { key: 'rooms_rev', header: 'Rooms', align: 'right', render: (r) => categoryCell(r, r.rooms_rev) },
    { key: 'bar_rev', header: 'Bar', align: 'right', render: (r) => categoryCell(r, r.bar_rev) },
    { key: 'food_rev', header: 'Food', align: 'right', render: (r) => categoryCell(r, r.food_rev) },
    { key: 'sauna_rev', header: 'Sauna', align: 'right', render: (r) => categoryCell(r, r.sauna_rev) },
    {
      key: 'total_rev',
      header: 'Total',
      align: 'right',
      render: (r) => <span className="font-semibold text-blue-700">{compact(r.total_rev)}</span>,
    },
    { key: 'manager_name', header: 'Handover Manager', render: (r) => r.manager_name ?? '—' },
    {
      key: 'receipt_photo',
      header: 'Receipt Photo',
      align: 'center',
      render: (r) =>
        r.has_receipt_photo ? (
          <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" aria-label="Receipt photo attached" />
        ) : (
          <Circle className="mx-auto h-5 w-5 text-gray-300" aria-label="No receipt photo" />
        ),
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Frama Dashboard</h1>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                Live
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">All branches &middot; {formatDate(date)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" onClick={handleExport} loading={exportMutation.isPending} disabled={!rows.length}>
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        <StatTiles
          rooms={totals.rooms}
          bar={totals.bar}
          food={totals.food}
          sauna={totals.sauna}
          other={totals.other}
        />

        <Card className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Report date" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} />
          <div>
            <label htmlFor="branch-filter" className="mb-1 block text-sm font-medium text-gray-700">Branch</label>
            <select
              id="branch-filter"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branch_name}</option>
              ))}
            </select>
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">
          <span>TODAY &bull; {dayLabel(date)}</span>
          <span className="flex items-center gap-1.5">
            {submittedCount}/{branchCount} Branches Submitted
            <CheckCircle2 className="h-4 w-4" />
          </span>
        </div>

        <Table
          columns={columns}
          data={rows}
          loading={isLoading}
          rowKey={(r) => `${r.branch_id}-${r.date}`}
          emptyMessage="No reports for the selected filters."
          footer={
            rows.length > 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-gray-900">
                      TOTAL TODAY: {formatCurrency(totals.total)}
                    </span>
                    <span className={`flex items-center gap-1.5 ${allSubmitted ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {allSubmitted ? (
                        <>
                          <CheckCheck className="h-4 w-4" /> All Branches Complete
                        </>
                      ) : (
                        `${submittedCount}/${branchCount} Branches Submitted`
                      )}
                    </span>
                  </div>
                </td>
              </tr>
            ) : undefined
          }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <RevenueTrendChart data={trend} />
          </div>
          <div className="space-y-6 lg:col-span-2">
            <RevenueByBranchChart data={chartData} branchCount={chartData.length} />
          </div>
        </div>

        {customMeta.length > 0 && (
          <Card className="space-y-4">
            <p className="text-sm font-semibold text-gray-800">Custom activity totals</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {customMeta.map((field) => (
                <div key={field.key} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
                  <p className="text-xs text-gray-500">{field.label}</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {field.aggregate
                      ? Number(customTotals[field.key] ?? 0).toLocaleString()
                      : '—'}
                  </p>
                  {field.business_type && <p className="text-xs text-gray-400">{field.business_type}</p>}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
