import { describe, it, expect } from 'vitest';

import { formatMoney, CurrencyMetaPartial } from './money';

describe('formatMoney', () => {
  const inrMeta: CurrencyMetaPartial = {
    currencyCode: 'INR',
    currencyName: 'Indian Rupee',
    symbol: '₹',
    locale: 'en-IN',
    decimalPlaces: 2,
    symbolPosition: 'PREFIX',
  };

  const usdMeta: CurrencyMetaPartial = {
    currencyCode: 'USD',
    currencyName: 'US Dollar',
    symbol: '$',
    locale: 'en-US',
    decimalPlaces: 2,
    symbolPosition: 'PREFIX',
  };

  const aedMeta: CurrencyMetaPartial = {
    currencyCode: 'AED',
    currencyName: 'UAE Dirham',
    symbol: 'AED',
    locale: 'ar-AE',
    decimalPlaces: 2,
    symbolPosition: 'SUFFIX',
  };

  it('formats INR correctly', () => {
    const result = formatMoney(12500000, inrMeta);
    expect(result.replace(/\s/g, '')).toBe('₹1,25,000.00');
  });

  it('formats USD correctly', () => {
    const result = formatMoney(1250000, usdMeta);
    expect(result.replace(/\s/g, '')).toBe('$12,500.00');
  });

  it('formats AED correctly with suffix', () => {
    const result = formatMoney(125000, aedMeta);
    expect(result.replace(/\s/g, '')).toBe('1,250.00AED');
  });

  it('formats zero correctly', () => {
    const result = formatMoney(0, inrMeta);
    expect(result.replace(/\s/g, '')).toBe('₹0.00');
  });

  it('formats null/undefined as zero', () => {
    expect(formatMoney(null, inrMeta).replace(/\s/g, '')).toBe('₹0.00');
    expect(formatMoney(undefined, inrMeta).replace(/\s/g, '')).toBe('₹0.00');
  });

  it('formats negative values correctly', () => {
    const resultPrefix = formatMoney(-10000, inrMeta);
    expect(resultPrefix.replace(/\s/g, '')).toBe('-₹100.00');

    const resultSuffix = formatMoney(-10000, aedMeta);
    expect(resultSuffix.replace(/\s/g, '')).toBe('-100.00AED');
  });

  it('respects decimalOverride option', () => {
    const result = formatMoney(12500000, inrMeta, { decimalOverride: 0 });
    expect(result.replace(/\s/g, '')).toBe('₹1,25,000');
  });

  it('respects showSymbol option', () => {
    const result = formatMoney(12500000, inrMeta, { showSymbol: false });
    expect(result.replace(/\s/g, '')).toBe('1,25,000.00');
  });

  it('respects symbolOverride option', () => {
    const result = formatMoney(12500000, inrMeta, { symbolOverride: 'Rs.' });
    expect(result.replace(/\s/g, '')).toBe('Rs.1,25,000.00');
  });
});
