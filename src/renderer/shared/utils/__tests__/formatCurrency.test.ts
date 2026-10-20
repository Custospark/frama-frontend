import { describe, expect, it } from 'vitest';
import { formatCurrency, formatCurrencyCompact } from '../formatCurrency';

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

describe('formatCurrencyCompact', () => {
  it('formats thousands as K', () => {
    expect(formatCurrencyCompact(12_500)).toBe('UGX 12.5K');
  });

  it('formats millions as M', () => {
    expect(formatCurrencyCompact(3_400_000)).toBe('UGX 3.4M');
  });

  it('formats billions as B', () => {
    expect(formatCurrencyCompact(1_200_000_000)).toBe('UGX 1.2B');
  });

  it('falls back to full format under a thousand', () => {
    expect(formatCurrencyCompact(999)).toBe('UGX 999');
  });

  it('treats null as zero', () => {
    expect(formatCurrencyCompact(null)).toBe('UGX 0');
  });
});
