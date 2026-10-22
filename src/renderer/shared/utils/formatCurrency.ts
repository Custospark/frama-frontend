const CURRENCY_SYMBOLS: Record<string, string> = {
  UGX: 'UGX',
  USD: '$',
  EUR: '€',
  GBP: '£',
  KES: 'KSh',
};

/** Frama Investments reports in Ugandan Shillings by default. */
export function getBusinessCurrency(): string {
  return (import.meta.env.VITE_CURRENCY as string) || 'UGX';
}

function symbolFor(code: string): string {
  return CURRENCY_SYMBOLS[code] || code;
}

export function formatCurrency(amount: string | number | null | undefined, currencyCode?: string): string {
  const code = (currencyCode || getBusinessCurrency()).toUpperCase();
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : (amount ?? NaN);
  if (isNaN(numericAmount)) return `${symbolFor(code)} 0`;

  const rounded = Math.round(numericAmount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${symbolFor(code)} ${formatted}`;
}
