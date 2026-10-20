import { type ReactNode } from 'react';

export function ChartTooltipShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-3 text-xs min-w-[180px]">
      <p className="font-semibold text-gray-900 mb-0.5 truncate">{title}</p>
      {subtitle && <p className="text-gray-500 mb-2">{subtitle}</p>}
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

export function ChartTooltipRow({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${accent ? 'text-blue-700' : muted ? 'text-red-600' : 'text-gray-700'}`}>
      <span>{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}
