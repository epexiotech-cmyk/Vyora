/**
 * Shared Money Utilities
 * Enforces the Vyora platform monetary standard: INTEGER PAISE.
 */

/**
 * Converts a decimal monetary amount to integer paise.
 * Safely rounds half-up to avoid floating point anomalies.
 * @param amount Decimal amount (e.g., 99.95)
 * @returns Integer paise (e.g., 9995)
 */
export const moneyToPaise = (amount: number | null | undefined): number => {
  if (amount == null) return 0;
  return Math.round(amount * 100);
};

/**
 * Converts integer paise back to a decimal monetary amount for UI display.
 * @param paise Integer paise (e.g., 9995)
 * @returns Decimal amount (e.g., 99.95)
 */
export const paiseToMoney = (paise: number | null | undefined): number => {
  if (paise == null) return 0;
  return paise / 100;
};

/**
 * Formats integer paise into a localized currency string.
 * @param paise Integer paise (e.g., 9995)
 * @param currencyCode Standard currency code, defaults to 'INR'
 * @returns Formatted string (e.g., "₹99.95")
 */
export const formatCurrency = (
  paise: number | null | undefined,
  currencyCode: string = 'INR',
): string => {
  const amount = paiseToMoney(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};
