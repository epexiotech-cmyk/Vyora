import { TaxDto } from '@vyora/types';
import { describe, expect, it } from 'vitest';

import {
  GstCalculationInvoiceInput,
  GstCalculationItemInput,
  gstCalculationService,
} from '../../src/services/GstCalculationService';

describe('GstCalculationService', () => {
  const availableTaxes: TaxDto[] = [
    { id: 'tax_5', name: 'GST 5%', rate: 5, taxType: 'GST', isActive: true, createdAt: new Date() },
    {
      id: 'tax_12',
      name: 'GST 12%',
      rate: 12,
      taxType: 'GST',
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: 'tax_18',
      name: 'GST 18%',
      rate: 18,
      taxType: 'GST',
      isActive: true,
      createdAt: new Date(),
    },
    { id: 'tax_0', name: 'GST 0%', rate: 0, taxType: 'GST', isActive: true, createdAt: new Date() },
  ];

  const buildInput = (
    stateCode: string | null,
    posCode: string | null,
    isReverseCharge: boolean,
    items: GstCalculationItemInput[],
  ): GstCalculationInvoiceInput<GstCalculationItemInput> => ({
    companyStateCode: stateCode,
    placeOfSupplyCode: posCode,
    isReverseCharge,
    items,
  });

  describe('A. INTRA STATE', () => {
    it('calculates CGST/SGST appropriately with IGST = 0', () => {
      const input = buildInput('24', '24', false, [
        { quantity: 1, rate: 100, discountAmount: 0, taxId: 'tax_18' },
      ]);

      const result = gstCalculationService.calculate(input, availableTaxes);

      expect(result.items[0].igstAmount).toBe(0);
      expect(result.items[0].cgstAmount).toBe(9); // 100 * 9%
      expect(result.items[0].sgstAmount).toBe(9); // 100 * 9%
      expect(result.items[0].taxAmount).toBe(18);
      expect(result.grandTotal).toBe(118);
    });
  });

  describe('B. INTER STATE', () => {
    it('calculates IGST appropriately with CGST/SGST = 0', () => {
      const input = buildInput('24', '27', false, [
        { quantity: 1, rate: 100, discountAmount: 0, taxId: 'tax_18' },
      ]);

      const result = gstCalculationService.calculate(input, availableTaxes);

      expect(result.items[0].cgstAmount).toBe(0);
      expect(result.items[0].sgstAmount).toBe(0);
      expect(result.items[0].igstAmount).toBe(18); // 100 * 18%
      expect(result.items[0].taxAmount).toBe(18);
      expect(result.grandTotal).toBe(118);
    });

    it('handles missing state codes by defaulting to Intra-state', () => {
      const input = buildInput(null, null, false, [
        { quantity: 1, rate: 100, discountAmount: 0, taxId: 'tax_18' },
      ]);
      const result = gstCalculationService.calculate(input, availableTaxes);
      expect(result.items[0].cgstAmount).toBe(9);
      expect(result.items[0].sgstAmount).toBe(9);
      expect(result.items[0].igstAmount).toBe(0);
    });
  });

  describe('C. MULTIPLE TAX RATES', () => {
    it('correctly aggregates multiple tax tiers on an invoice', () => {
      const input = buildInput('24', '24', false, [
        { quantity: 1, rate: 100, discountAmount: 0, taxId: 'tax_5' }, // 5 tax
        { quantity: 1, rate: 100, discountAmount: 0, taxId: 'tax_12' }, // 12 tax
        { quantity: 1, rate: 100, discountAmount: 0, taxId: 'tax_18' }, // 18 tax
      ]);

      const result = gstCalculationService.calculate(input, availableTaxes);

      expect(result.items[0].taxAmount).toBe(5);
      expect(result.items[1].taxAmount).toBe(12);
      expect(result.items[2].taxAmount).toBe(18);

      expect(result.subtotal).toBe(300);
      expect(result.taxAmount).toBe(35);
      expect(result.grandTotal).toBe(335);
    });
  });

  describe('D. REVERSE CHARGE', () => {
    it('sets final taxAmount to 0 for supplier while computing rate lines', () => {
      const input = buildInput('24', '24', true, [
        { quantity: 1, rate: 100, discountAmount: 0, taxId: 'tax_18' },
      ]);

      const result = gstCalculationService.calculate(input, availableTaxes);

      // The tax is computed
      expect(result.items[0].cgstAmount).toBe(9);
      expect(result.items[0].sgstAmount).toBe(9);

      // But supplier does not collect it
      expect(result.items[0].taxAmount).toBe(0);
      expect(result.items[0].lineTotal).toBe(100);

      expect(result.taxAmount).toBe(0);
      expect(result.grandTotal).toBe(100);
    });
  });

  describe('E. ROUNDING', () => {
    it('rounds 99.49 down correctly', () => {
      const input = buildInput('24', '24', false, [
        { quantity: 1, rate: 99.49, discountAmount: 0, taxId: 'tax_0' },
      ]);

      const result = gstCalculationService.calculate(input, availableTaxes);

      expect(result.subtotal).toBe(99.49);
      expect(result.roundOffAmount).toBeCloseTo(-0.49, 2);
      expect(result.grandTotal).toBe(99);
    });

    it('rounds 99.50 up correctly', () => {
      const input = buildInput('24', '24', false, [
        { quantity: 1, rate: 99.5, discountAmount: 0, taxId: 'tax_0' },
      ]);

      const result = gstCalculationService.calculate(input, availableTaxes);

      expect(result.subtotal).toBe(99.5);
      expect(result.roundOffAmount).toBeCloseTo(0.5, 2);
      expect(result.grandTotal).toBe(100);
    });

    it('rounds 99.51 up correctly', () => {
      const input = buildInput('24', '24', false, [
        { quantity: 1, rate: 99.51, discountAmount: 0, taxId: 'tax_0' },
      ]);

      const result = gstCalculationService.calculate(input, availableTaxes);

      expect(result.subtotal).toBe(99.51);
      expect(result.roundOffAmount).toBeCloseTo(0.49, 2);
      expect(result.grandTotal).toBe(100);
    });

    it('handles precision splitting correctly (e.g. 15.11 tax split into CGST/SGST)', () => {
      const input = buildInput('24', '24', false, [
        // taxable: 83.94, tax18: 15.1092 -> rounded to 15
        { quantity: 1, rate: 83.94, discountAmount: 0, taxId: 'tax_18' },
      ]);

      const result = gstCalculationService.calculate(input, availableTaxes);

      expect(result.items[0].cgstAmount + result.items[0].sgstAmount).toBe(15);
      expect(result.items[0].cgstAmount).toBe(8); // Math.round(15 / 2)
      expect(result.items[0].sgstAmount).toBe(7); // 15 - 8
    });
  });

  describe('F. EDGE CASES', () => {
    it('handles zero quantity', () => {
      const input = buildInput('24', '24', false, [
        { quantity: 0, rate: 100, discountAmount: 0, taxId: 'tax_18' },
      ]);
      const result = gstCalculationService.calculate(input, availableTaxes);
      expect(result.grandTotal).toBe(0);
    });

    it('handles zero rate', () => {
      const input = buildInput('24', '24', false, [
        { quantity: 10, rate: 0, discountAmount: 0, taxId: 'tax_18' },
      ]);
      const result = gstCalculationService.calculate(input, availableTaxes);
      expect(result.grandTotal).toBe(0);
    });

    it('handles large quantities/values without crashing', () => {
      const input = buildInput('24', '24', false, [
        { quantity: 999999, rate: 999999, discountAmount: 0, taxId: 'tax_18' },
      ]);
      const result = gstCalculationService.calculate(input, availableTaxes);
      expect(result.grandTotal).toBeGreaterThan(0);
      expect(result.items[0].taxAmount).toBeGreaterThan(0);
    });

    it('handles missing tax definitions gracefully', () => {
      const input = buildInput('24', '24', false, [
        { quantity: 1, rate: 100, discountAmount: 0, taxId: 'missing_tax' },
      ]);
      const result = gstCalculationService.calculate(input, availableTaxes);
      expect(result.items[0].taxAmount).toBe(0);
      expect(result.items[0].cgstAmount).toBe(0);
      expect(result.grandTotal).toBe(100);
    });
  });

  describe('G. REGRESSION PROTECTION', () => {
    it('asserts strict reconciliation of math (subtotal - discount + tax = grandTotal)', () => {
      const input = buildInput('24', '24', false, [
        { quantity: 2, rate: 150.33, discountAmount: 10.15, taxId: 'tax_12' },
        { quantity: 5, rate: 99.99, discountAmount: 0, taxId: 'tax_5' },
      ]);

      const result = gstCalculationService.calculate(input, availableTaxes);

      // (2 * 150.33) + (5 * 99.99)
      // 300.66 + 499.95 = 800.61
      expect(result.subtotal).toBeCloseTo(800.61, 2);
      expect(result.discountAmount).toBeCloseTo(10.15, 2);

      // Math assertion
      const unroundedExpected = result.subtotal - result.discountAmount + result.taxAmount;
      expect(result.grandTotal - result.roundOffAmount).toBeCloseTo(unroundedExpected, 2);

      // The total taxAmount from the invoice should equal the sum of item taxAmounts
      const sumOfItemTaxes = result.items.reduce((acc, item) => acc + item.taxAmount, 0);
      expect(result.taxAmount).toBe(sumOfItemTaxes);
    });
  });
});
