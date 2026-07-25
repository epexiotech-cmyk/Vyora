/**
 * Normalizes a string by trimming leading/trailing whitespace,
 * collapsing consecutive whitespace into a single space,
 * and converting it to lowercase.
 *
 * Useful for duplicate detection (e.g. Item names, Unit names).
 */
export function normalizeName(val: string | null | undefined): string {
  if (!val) return '';
  return val.trim().replace(/\s+/g, ' ').toLowerCase();
}
