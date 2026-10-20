import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer } from '../../shared/components/charts/ChartContainer';
import {
  CHART_THEME,
  formatAxisCurrency,
} from '../../shared/components/charts/chartPrimitives';
import {
  ChartTooltipRow,
  ChartTooltipShell,
} from '../../shared/components/charts/ChartTooltip';
import { formatCurrency } from '../../shared/utils/formatCurrency';
import { formatDate } from '../../shared/utils/formatDateTime';
import type { TrendPoint } from '../../shared/types/models';

const BRANCH_SERIES = [
  { key: 'rooms', name: 'Rooms', color: CHART_THEME.series[0] },
  { key: 'bar', name: 'Bar', color: CHART_THEME.series[6] },
  { key: 'food', name: 'Food', color: CHART_THEME.series[1] },
  { key: 'sauna', name: 'Sauna', color: CHART_THEME.series[2] },
  { key: 'other', name: 'Other', color: CHART_THEME.series[3] },
] as const;

type TrendRow = TrendPoint & { label: string };

interface RevenueTrendChartProps {
  data: TrendPoint[];
  title?: string;
  scopeLabel?: string;
  valueLabel?: string;
}

export function RevenueTrendChart({
  data,
  title = 'Revenue Trend',
  scopeLabel = 'all branches',
  valueLabel = 'Total revenue',
}: RevenueTrendChartProps) {
  const chartData: TrendRow[] = data.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">Daily total · {scopeLabel}</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">No data yet</span>
        </div>
        <div className="h-64 flex items-center justify-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
          Trends appear after the first day of activity
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">
            Last {chartData.length} days · {scopeLabel}
          </p>
        </div>
      </div>

      <ChartContainer className="h-72" minHeight={288}>
        {(size) => (
          <ResponsiveContainer width={size.width} height={size.height} debounce={50}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="adminRevenueTrendFill" x1="0" y1="0" x2="0" y2="1">
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
                  const row = payload[0]?.payload as TrendRow;
                  return (
                    <ChartTooltipShell title={row.label} subtitle="Daily total">
                      <ChartTooltipRow label={valueLabel} value={formatCurrency(row.total)} accent />
                    </ChartTooltipShell>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke={CHART_THEME.line}
                strokeWidth={2.5}
                fill="url(#adminRevenueTrendFill)"
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

export function RevenueByBranchChart({ data, branchCount }: { data: { name: string; rooms: number; bar: number; food: number; sauna: number; other: number }[]; branchCount: number }) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Revenue by Branch</h3>
            <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">Stacked by business line</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">No data yet</span>
        </div>
        <div className="h-64 flex items-center justify-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
          Branch performance appears after the first submission
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Revenue by Branch</h3>
          <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">{branchCount} branch{branchCount === 1 ? '' : 'es'} · stacked by business line</p>
        </div>
      </div>

      <ChartContainer className="h-72" minHeight={288}>
        {(size) => (
          <ResponsiveContainer width={size.width} height={size.height} debounce={50}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={formatAxisCurrency} />
              <Tooltip
                cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const rows = payload.map((p) => ({ name: String(p.name), value: Number(p.value) }));
                  const sum = rows.reduce((s, r) => s + r.value, 0);
                  return (
                    <ChartTooltipShell title={String(label)} subtitle={`Total ${formatCurrency(sum)}`}>
                      {rows.map((r) => (
                        <ChartTooltipRow key={r.name} label={r.name} value={formatCurrency(r.value)} />
                      ))}
                    </ChartTooltipShell>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              {BRANCH_SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.name} stackId="r" fill={s.color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>
    </div>
  );
}
