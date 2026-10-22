import { describe, expect, it } from 'vitest';
import { formatCurrency } from '../formatCurrency';

describe('formatCurrency', () => {
  it('formats a number with the default currency symbol', () => {
    expect(formatCurrency(1500)).toBe('UGX 1,500');
  });

  it('formats a numeric string', () => {
    expect(formatCurrency('2000')).toBe('UGX 2,000');
  });

  it('rounds decimals', () => {
    expect(formatCurrency(1999.6)).toBe('UGX 2,000');
  });

  it('returns zero for null or invalid values', () => {
    expect(formatCurrency(null)).toBe('UGX 0');
    expect(formatCurrency(undefined)).toBe('UGX 0');
    expect(formatCurrency('not-a-number')).toBe('UGX 0');
  });

  it('uses a supplied currency code', () => {
    expect(formatCurrency(500, 'USD')).toBe('$ 500');
    expect(formatCurrency(500, 'KES')).toBe('KSh 500');
  });
});
