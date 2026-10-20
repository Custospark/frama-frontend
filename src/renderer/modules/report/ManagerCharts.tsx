import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
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

export interface RevenueMixSlice {
  name: string;
  value: number;
  fill: string;
}

export function RevenueMixChart({ data, title = "Today's Revenue Mix" }: { data: RevenueMixSlice[]; title?: string }) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">Split by business line</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">No data yet</span>
        </div>
        <div className="h-64 flex items-center justify-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
          Submit today&apos;s report to see the breakdown
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wide">Split by business line</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-blue-700 tabular-nums">{formatCurrency(total)}</p>
          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Today total</p>
        </div>
      </div>

      <ChartContainer className="h-64" minHeight={256}>
        {(size) => (
          <ResponsiveContainer width={size.width} height={size.height} debounce={50}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={formatAxisCurrency} />
              <Tooltip
                cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const slice = payload[0]?.payload as RevenueMixSlice;
                  const pct = total > 0 ? (slice.value / total) * 100 : 0;
                  return (
                    <ChartTooltipShell title={slice.name} subtitle={`${pct.toFixed(1)}% of today`}>
                      <ChartTooltipRow label="Revenue" value={formatCurrency(slice.value)} accent />
                    </ChartTooltipShell>
                  );
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>
    </div>
  );
}
