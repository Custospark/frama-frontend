import { describe, expect, it } from 'vitest';
import { sumCustomField, sumDashboardRows } from '../dashboardTotals';
import type { DashboardRow } from '../../../shared/types/models';

function row(overrides: Partial<DashboardRow>): DashboardRow {
  return {
    branch_id: 1,
    branch_name: 'Branch',
    branch_code: 'BR',
    date: '2026-10-21',
    business_type: 'motel',
    rooms_rev: 0,
    bar_rev: 0,
    food_rev: 0,
    sauna_rev: 0,
    other_rev: 0,
    rooms_occupied: null,
    total_rev: 0,
    expenses: 0,
    net_rev: 0,
    cash_handed_over: 0,
    comment: null,
    manager_name: null,
    attachments_count: 0,
    receipt_count: 0,
    expense_receipt_count: 0,
    has_receipt_photo: false,
    first_attachment_url: null,
    first_attachment_is_image: false,
    report_id: 1,
    status: 'Submitted',
    submitted_at: null,
    custom_values: {},
    ...overrides,
  };
}

describe('sumDashboardRows', () => {
  it('sums every money column across submitted rows', () => {
    const totals = sumDashboardRows([
      row({ rooms_rev: 120000, bar_rev: 60000, food_rev: 80000, sauna_rev: 0, other_rev: 10000, total_rev: 270000, expenses: 20000, cash_handed_over: 250000 }),
      row({ rooms_rev: 100000, bar_rev: 0, food_rev: 50000, sauna_rev: 25000, other_rev: 5000, total_rev: 180000, expenses: 30000, cash_handed_over: 150000 }),
    ]);

    expect(totals).toEqual({
      rooms: 220000,
      bar: 60000,
      food: 130000,
      sauna: 25000,
      other: 15000,
      total: 450000,
      expenses: 50000,
      cash: 400000,
    });
  });

  it('ignores pending rows (the API sends zeroes for them)', () => {
    const totals = sumDashboardRows([
      row({ total_rev: 450000, rooms_rev: 450000, cash_handed_over: 400000 }),
      row({ report_id: null, status: 'Pending' }),
    ]);

    expect(totals.total).toBe(450000);
    expect(totals.cash).toBe(400000);
  });

  it('returns zeroes for an empty result set', () => {
    expect(sumDashboardRows([]).total).toBe(0);
  });

  it('keeps the table total in sync with the sum of the rows', () => {
    const rows = [row({ total_rev: 450000 }), row({ total_rev: 270000 })];
    const tableSum = rows.reduce((sum, item) => sum + item.total_rev, 0);

    expect(sumDashboardRows(rows).total).toBe(tableSum);
  });
});

describe('sumCustomField', () => {
  it('adds numeric custom values and skips missing or non-numeric ones', () => {
    const rows = [
      row({ custom_values: { conference_guests: 12, notes: 'n/a' } }),
      row({ custom_values: { conference_guests: '8' } }),
      row({ custom_values: {} }),
    ];

    expect(sumCustomField(rows, 'conference_guests')).toBe(20);
    expect(sumCustomField(rows, 'notes')).toBe(0);
    expect(sumCustomField(rows, 'missing')).toBe(0);
  });
});
