import { SalesInvoiceDto } from '@vyora/types';
import { describe, expect, it } from 'vitest';

import { GstInvoiceV1 } from '../../src/templates/gst-invoice-v1';

describe('gst-invoice-v1 template', () => {
  const mockPayload = {
    id: 'inv_1',
    companyId: 'comp_1',
    financialYearId: 'fy_1',
    invoiceNumber: 'INV-001',
    invoiceDate: '2023-01-01',
    status: 'SUBMITTED',
    isReverseCharge: false,
    placeOfSupplyCode: '27',

    companyNameSnapshot: 'Test Company',
    companyGstinSnapshot: '27AAAAA0000A1Z5',
    companyPanSnapshot: 'AAAAA0000A',
    companyStateNameSnapshot: 'Maharashtra',
    companyStateCodeSnapshot: '27',
    companyAddressSnapshot: '123 Test St',

    billingName: 'Customer XYZ',
    billingGstin: '27BBBBB0000B1Z5',
    billingStateCode: '27',

    subtotal: 100000,
    taxAmount: 18000,
    roundOffAmount: 0,
    grandTotal: 118000,

    items: [
      {
        id: 'item_1',
        salesInvoiceId: 'inv_1',
        description: 'Test Item',
        quantity: 1,
        rate: 100000,
        taxableAmount: 100000,
        cgstRate: 9,
        cgstAmount: 9000,
        sgstRate: 9,
        sgstAmount: 9000,
        igstRate: 0,
        igstAmount: 0,
        lineTotal: 118000,
      },
    ],
  } as unknown as SalesInvoiceDto;

  it('renders TAX INVOICE title', async () => {
    const html = await GstInvoiceV1.render({ documentType: 'TAX_INVOICE', data: mockPayload });
    expect(html).toContain('TAX INVOICE');
  });

  it('renders company snapshot fields', async () => {
    const html = await GstInvoiceV1.render({ documentType: 'TAX_INVOICE', data: mockPayload });
    expect(html).toContain('Test Company');
    expect(html).toContain('27AAAAA0000A1Z5');
    expect(html).toContain('AAAAA0000A');
    expect(html).toContain('Maharashtra');
  });

  it('renders customer snapshot fields', async () => {
    const html = await GstInvoiceV1.render({ documentType: 'TAX_INVOICE', data: mockPayload });
    expect(html).toContain('Customer XYZ');
    expect(html).toContain('27BBBBB0000B1Z5');
  });

  it('renders item rows', async () => {
    const html = await GstInvoiceV1.render({ documentType: 'TAX_INVOICE', data: mockPayload });
    expect(html).toContain('Test Item');
    expect(html).toContain('1,000.00'); // rate
    expect(html).toContain('90.00'); // tax
  });

  it('renders totals', async () => {
    const html = await GstInvoiceV1.render({ documentType: 'TAX_INVOICE', data: mockPayload });
    expect(html).toContain('1,180.00');
  });

  it('renders tax summary', async () => {
    const html = await GstInvoiceV1.render({ documentType: 'TAX_INVOICE', data: mockPayload });
    expect(html).toContain('Tax Summary');
    expect(html).toContain('Total Taxable Value');
  });

  it('renders authorised signatory section', async () => {
    const html = await GstInvoiceV1.render({ documentType: 'TAX_INVOICE', data: mockPayload });
    expect(html).toContain('Authorized Signatory');
  });
});
