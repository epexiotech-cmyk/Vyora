import type { CurrencyMeta } from '@vyora/types';
import { formatMoney } from '@vyora/utils';

/**
 * Strictly formats numerical values into standardized Indian Rupee currency strings.
 * Ensures consistent precision and locale styling across all print templates.
 *
 * @deprecated Use formatMoney directly instead
 */
export function formatCurrencyINR(
  amount: number | null | undefined,
  currencyMeta?: CurrencyMeta,
): string {
  if (amount === undefined || amount === null) {
    return '0.00';
  }

  if (currencyMeta) {
    return formatMoney(amount, currencyMeta);
  }

  // Fallback if no meta is provided (e.g. from legacy tests)
  return formatMoney(amount, {
    currencyCode: 'INR',
    currencyName: 'Indian Rupee',
    symbol: '₹',
    locale: 'en-IN',
    decimalPlaces: 2,
    symbolPosition: 'PREFIX',
  });
}
