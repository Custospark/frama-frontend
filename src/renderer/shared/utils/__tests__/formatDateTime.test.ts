import { describe, expect, it } from 'vitest';
import { toISODate, formatDate, formatDateTime, formatClock } from '../formatDateTime';

describe('toISODate', () => {
  it('formats a date as YYYY-MM-DD with zero padding', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate(new Date(2026, 9, 20))).toBe('2026-10-20');
  });
});

describe('formatDate', () => {
  it('formats an ISO string as a friendly date', () => {
    expect(formatDate('2026-10-20')).toMatch(/20 Oct 2026/);
  });

  it('returns a dash for empty values', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns a dash for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('includes both date and time', () => {
    const result = formatDateTime('2026-10-20T21:03:00');
    expect(result).toMatch(/20 Oct 2026/);
    expect(result).toMatch(/21:03/);
  });

  it('returns a dash for empty values', () => {
    expect(formatDateTime(null)).toBe('—');
  });
});

describe('formatClock', () => {
  it('converts 24h time to 12h', () => {
    expect(formatClock('21:00')).toBe('9:00 PM');
    expect(formatClock('09:30')).toBe('9:30 AM');
  });

  it('handles midnight and noon', () => {
    expect(formatClock('00:00')).toBe('12:00 AM');
    expect(formatClock('12:00')).toBe('12:00 PM');
  });
});
