import { CreateSalesInvoiceInput, SalesInvoiceDto, createSalesInvoiceSchema } from '@vyora/types';
import { z } from 'zod';

type InvoiceFormValues = z.input<typeof createSalesInvoiceSchema>;

export interface UIError {
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export function normalizeError(e: unknown): UIError {
  return {
    title: 'Operation Failed',
    message: e instanceof Error ? e.message : String(e) || 'An unexpected error occurred.',
    severity: 'error',
  };
}

export class InvoiceMapper {
  static dtoToForm(dto: SalesInvoiceDto): InvoiceFormValues {
    return {
      ...dto,
      invoiceDate: dto.invoiceDate ? new Date(dto.invoiceDate) : new Date(),
      items:
        dto.items?.map((item) => ({
          ...item,
        })) || [],
    };
  }

  static formToCreateDto(
    values: InvoiceFormValues,
    companyId: string,
    financialYearId: string,
    calculationState: {
      totals: {
        subtotal: number;
        totalDiscount: number;
        totalTax: number;
        roundOffAmount: number;
        grandTotal: number;
      };
    },
  ): CreateSalesInvoiceInput {
    return {
      companyId,
      financialYearId,
      customerId: values.customerId,
      invoiceNumber: values.invoiceNumber,
      invoiceDate: new Date(values.invoiceDate),
      isReverseCharge: values.isReverseCharge || false,
      subtotal: calculationState.totals.subtotal || 0,
      discountAmount: calculationState.totals.totalDiscount || 0,
      taxAmount: calculationState.totals.totalTax || 0,
      roundOffAmount: calculationState.totals.roundOffAmount || 0,
      grandTotal: calculationState.totals.grandTotal || 0,
      items:
        values.items?.map((l) => ({
          productId: l.productId,
          unitId: l.unitId || '00000000-0000-0000-0000-000000000000',
          taxId: l.taxId || '00000000-0000-0000-0000-000000000000',
          quantity: Number(l.quantity) || 1,
          rate: Number(l.rate) || 0,
          discountAmount: Number(l.discountAmount) || 0,
          taxableAmount: Number(l.taxableAmount) || 0,
          taxAmount: 0,
          lineTotal: Number(l.lineTotal) || 0,
        })) || [],
    };
  }
}
