import type { DashboardRow } from '../../shared/types/models';

export interface DashboardTotals {
  rooms: number;
  bar: number;
  food: number;
  sauna: number;
  other: number;
  total: number;
  month: number;
  expenses: number;
  cash: number;
}

/**
 * Sums a dashboard result set exactly as displayed in the table. Pending rows
 * carry zeroes from the API, so they never contribute to a total.
 */
export function sumDashboardRows(rows: DashboardRow[]): DashboardTotals {
  return rows.reduce<DashboardTotals>(
    (acc, row) => ({
      rooms: acc.rooms + (row.rooms_rev ?? 0),
      bar: acc.bar + (row.bar_rev ?? 0),
      food: acc.food + (row.food_rev ?? 0),
      sauna: acc.sauna + (row.sauna_rev ?? 0),
      other: acc.other + (row.other_rev ?? 0),
      total: acc.total + (row.total_rev ?? 0),
      month: acc.month + (row.month_total ?? 0),
      expenses: acc.expenses + (row.expenses ?? 0),
      cash: acc.cash + (row.cash_handed_over ?? 0),
    }),
    { rooms: 0, bar: 0, food: 0, sauna: 0, other: 0, total: 0, month: 0, expenses: 0, cash: 0 },
  );
}

/** Sum one numeric custom field across the visible rows. */
export function sumCustomField(rows: DashboardRow[], key: string): number {
  return rows.reduce((sum, row) => {
    const raw = row.custom_values?.[key];
    if (typeof raw === 'number') return sum + (Number.isFinite(raw) ? raw : 0);
    if (typeof raw !== 'string' || raw.trim() === '') return sum;
    const value = Number(raw);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);
}
