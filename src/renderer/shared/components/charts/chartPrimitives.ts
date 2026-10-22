export const CHART_THEME = {
  line: '#2563eb',
  lineLight: '#93c5fd',
  fillStart: 'rgba(37, 99, 235, 0.22)',
  fillEnd: 'rgba(37, 99, 235, 0.02)',
  grid: '#eef2f7',
  reference: '#94a3b8',
  series: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'],
} as const;

export const PIE_COLORS = CHART_THEME.series;

export function formatAxisCurrency(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function chartAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
