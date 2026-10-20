import { describe, expect, it } from 'vitest';
import { formatMoney, parseMoney } from '../moneyInput';

describe('formatMoney', () => {
  it('groups thousands with commas', () => {
    expect(formatMoney('1234567')).toBe('1,234,567');
  });

  it('keeps up to two decimal places', () => {
    expect(formatMoney('1234.56')).toBe('1,234.56');
  });

  it('truncates extra decimals', () => {
    expect(formatMoney('12.999')).toBe('12.99');
  });

  it('strips invalid characters and keeps digits grouped', () => {
    expect(formatMoney('abc1234xyz')).toBe('1,234');
  });

  it('keeps a trailing dot while typing', () => {
    expect(formatMoney('12.')).toBe('12.');
  });

  it('handles empty input', () => {
    expect(formatMoney('')).toBe('');
  });
});

describe('parseMoney', () => {
  it('parses a comma-formatted string into a number', () => {
    expect(parseMoney('1,234.56')).toBe(1234.56);
  });

  it('returns 0 for empty input', () => {
    expect(parseMoney('')).toBe(0);
  });

  it('rounds to two decimals', () => {
    expect(parseMoney('10.999')).toBe(11);
  });

  it('ignores non-numeric characters', () => {
    expect(parseMoney('UGX 2,000')).toBe(2000);
  });
});
