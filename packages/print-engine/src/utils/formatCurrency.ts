/**
 * Strictly formats numerical values into standardized Indian Rupee currency strings.
 * Ensures consistent precision and locale styling across all print templates.
 */
export function formatCurrencyINR(amount: number | null | undefined): string {
  const safeAmount = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}
