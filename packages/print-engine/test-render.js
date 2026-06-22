import { renderDocument } from './src/index';
async function main() {
  const mockDto = {
    id: 'test-1',
    invoiceNumber: 'INV/26-27/001',
    invoiceDate: new Date(),
    status: 'DRAFT',
    subtotal: 1000,
    discountAmount: 0,
    taxAmount: 180,
    roundOffAmount: 0,
    grandTotal: 1180,
    amountInWords: 'One Thousand One Hundred and Eighty',
    isReverseCharge: false,
    company: {
      legalName: 'Vyora Technologies Pvt Ltd',
      address: '123 Main Street',
      gstin: '27AABCU9603R1ZM',
      pan: 'AABCU9603R',
      stateName: 'Maharashtra',
      stateCode: '27',
      email: 'hello@vyora.com',
      mobile: '9999999999',
    },
    customer: {
      name: 'Acme Corp',
      address: '456 Secondary Road',
      city: 'Mumbai',
      pincode: '400001',
      gstin: '27XYZABC1234D1Z',
      state: '27',
    },
    items: [
      {
        productName: 'Professional Services',
        hsnCode: '9983',
        unitCode: 'NOS',
        quantity: 1,
        rate: 1000,
        discountAmount: 0,
        taxableAmount: 1000,
        taxRate: 18,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 0,
        cgstAmount: 90,
        sgstAmount: 90,
        igstAmount: 0,
        lineTotal: 1180,
      },
    ],
    taxSummary: [
      {
        taxRate: 18,
        taxableAmount: 1000,
        cgstAmount: 90,
        sgstAmount: 90,
        igstAmount: 0,
        totalTaxAmount: 180,
      },
    ],
  };
  const html = await renderDocument('gst-invoice-v1', {
    documentType: 'TAX_INVOICE',
    data: mockDto,
  });
  console.log(html);
  if (html.includes('undefined') || html.includes('[object Object]')) {
    console.error('HTML contains undefined or object Object!');
    process.exit(1);
  }
}
main().catch(console.error);
