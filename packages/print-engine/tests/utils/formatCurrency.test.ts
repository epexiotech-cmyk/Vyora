import { describe, it, expect } from 'vitest';

import { formatCurrencyINR } from '../../src/utils/formatCurrency';

describe('formatCurrencyINR', () => {
  it('formats exactly 0', () => {
    // Note: spaces between symbol and number in Intl.NumberFormat can vary by Node version.
    // We expect basic INR formatting like ₹0.00 or ₹ 0.00
    const result = formatCurrencyINR(0);
    expect(result).toMatch(/₹\s*0\.00/);
  });

  it('formats exactly 1', () => {
    const result = formatCurrencyINR(100);
    expect(result).toMatch(/₹\s*1\.00/);
  });

  it('formats 1000 with Indian grouping', () => {
    const result = formatCurrencyINR(100000);
    expect(result).toMatch(/₹\s*1,000\.00/);
  });

  it('formats 100000 with Indian grouping', () => {
    const result = formatCurrencyINR(10000000);
    expect(result).toMatch(/₹\s*1,00,000\.00/);
  });

  it('formats 1000000.55 with precision', () => {
    const result = formatCurrencyINR(100000055);
    expect(result).toMatch(/₹\s*10,00,000\.55/);
  });

  it('handles null and undefined safely', () => {
    expect(formatCurrencyINR(null)).toBe('0.00');
    expect(formatCurrencyINR(undefined)).toBe('0.00');
  });
});
