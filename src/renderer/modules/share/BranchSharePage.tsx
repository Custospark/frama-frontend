import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertCircle, BedDouble, CalendarDays, Flame, Lock, RefreshCw, UtensilsCrossed, Wallet, Wine } from 'lucide-react';
import { ChartContainer } from '../../shared/components/charts/ChartContainer';
import { CHART_THEME, formatAxisCurrency } from '../../shared/components/charts/chartPrimitives';
import { ChartTooltipRow, ChartTooltipShell } from '../../shared/components/charts/ChartTooltip';
import { DashboardStatCard } from '../../shared/components/cards/DashboardStatCard';
import type { CardColor } from '../../shared/components/cards/statCardStyles';
import { AdminShell } from '../../shared/components/layout/AdminShell';
import { PageLoader } from '../../shared/components/loading/Spinner';
import { useBranchShareSummary, isShareNotFound } from './ShareQueries';
import { formatCurrency } from '../../shared/utils/formatCurrency';
import { formatDate } from '../../shared/utils/formatDateTime';

interface BranchSharePageProps {
  slug: string;
}

export default function BranchSharePage({ slug }: BranchSharePageProps) {
  const { data, isLoading, isError, error, refetch, isFetching } = useBranchShareSummary(slug);

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-24">
          <PageLoader />
        </div>
      </AdminShell>
    );
  }

  if (isError || !data) {
    const notFound = isShareNotFound(error);
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-16">
          <div className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">
              {notFound ? 'Link unavailable' : 'Could not load summary'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {notFound
                ? 'This branch link is invalid. Check the address with the branch manager.'
                : 'Something went wrong while loading this branch summary. Please try again.'}
            </p>
            {!notFound && (
              <button
                onClick={() => void refetch()}
                disabled={isFetching}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            )}
          </div>
        </div>
      </AdminShell>
    );
  }

  const { branch, today, recent, trend, month_total, submitted_this_month } = data;

  const tiles: { label: string; value: string; icon: typeof Wallet; color: CardColor; badge: string; sub?: string }[] = [
    { label: "Today's Total", value: formatCurrency(today?.total_rev ?? 0), icon: Wallet, color: 'blue', badge: 'Today' },
    { label: 'This Month', value: formatCurrency(month_total), icon: CalendarDays, color: 'green', badge: 'Month', sub: `${submitted_this_month} report${submitted_this_month === 1 ? '' : 's'} submitted` },
    { label: 'Rooms', value: formatCurrency(today?.rooms_rev ?? 0), icon: BedDouble, color: 'indigo', badge: 'Rooms' },
    { label: 'Bar', value: formatCurrency(today?.bar_rev ?? 0), icon: Wine, color: 'amber', badge: 'Bar' },
    { label: 'Food', value: formatCurrency(today?.food_rev ?? 0), icon: UtensilsCrossed, color: 'green', badge: 'Food' },
    { label: 'Sauna', value: formatCurrency(today?.sauna_rev ?? 0), icon: Flame, color: 'purple', badge: 'Sauna' },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{branch.branch_name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Daily sales summary &middot; updated {formatDate(data.generated_at.slice(0, 10))}
              {branch.manager_name ? ` · ${branch.manager_name}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {today ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                Submitted today
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                No report today yet
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
              <Lock className="h-3.5 w-3.5" /> Read-only
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {tiles.map(({ label, value, icon: Icon, color, badge, sub }) => (
            <DashboardStatCard key={label} label={label} value={value} icon={Icon} color={color} badge={badge} sub={sub} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <RevenueTrendCard data={trend} />
          </div>
          <div className="lg:col-span-2">
            <RecentSubmissionsCard reports={recent} />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function RevenueTrendCard({ data }: { data: { date: string; total: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-800">Revenue Trend</h3>
        <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-500">Recent daily totals</p>
        <div className="mt-4 flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-400">
          No activity recorded yet
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Revenue Trend</h3>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-500">Last {data.length} day{data.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <ChartContainer className="h-72" minHeight={288}>
        {(size) => (
          <ResponsiveContainer width={size.width} height={size.height} debounce={50}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="shareBranchTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_THEME.fillStart} />
                  <stop offset="100%" stopColor={CHART_THEME.fillEnd} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.slice(5)}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatAxisCurrency}
              />
              <Tooltip
                cursor={{ stroke: CHART_THEME.lineLight, strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as { date: string; total: number };
                  return (
                    <ChartTooltipShell title={formatDate(row.date)} subtitle="Daily total">
                      <ChartTooltipRow label="Revenue" value={formatCurrency(row.total)} accent />
                    </ChartTooltipShell>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke={CHART_THEME.line}
                strokeWidth={2.5}
                fill="url(#shareBranchTrendFill)"
                dot={{ r: 3, fill: CHART_THEME.line, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: CHART_THEME.line, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>
    </div>
  );
}

function RecentSubmissionsCard({ reports }: { reports: { report_date: string; total_rev: number; manager_name: string | null }[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">Recent Submissions</h3>
      {reports.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">No reports yet</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.report_date} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{formatDate(r.report_date)}</p>
                {r.manager_name && <p className="truncate text-xs text-gray-400">{r.manager_name}</p>}
              </div>
              <span className="ml-2 shrink-0 text-sm font-semibold text-gray-900">{formatCurrency(r.total_rev)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
