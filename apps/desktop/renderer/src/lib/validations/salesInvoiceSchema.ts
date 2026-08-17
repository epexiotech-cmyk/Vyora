import { z } from 'zod';

export const salesInvoiceLineSchema = z.object({
  productId: z.string().optional().nullable(),
  productName: z.string().optional(),
  qty: z.coerce.number().min(0.001, 'Quantity must be greater than 0').optional(),
  rate: z.coerce.number().min(0, 'Rate cannot be negative').optional(),
  discountPercent: z.coerce.number().min(0, 'Min 0%').max(100, 'Max 100%').optional(),
  taxPercent: z.coerce.number().min(0, 'Min 0%').max(100, 'Max 100%').optional(),
  amount: z.coerce.number().optional(),
  unitId: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  hsnCode: z.string().optional().nullable(),
  itemTypeSnapshot: z
    .enum(['INVENTORY_ITEM', 'NON_INVENTORY_ITEM', 'SERVICE'])
    .optional()
    .nullable(),
});

export const salesInvoiceSchema = z
  .object({
    customer: z.string().min(1, 'Please select a customer'),
    customerGstin: z.string().optional(),
    customerAddress: z.string().optional(),
    billingName: z.string().optional(),
    billingGstin: z.string().optional(),
    billingAddress: z.string().optional(),
    billingCity: z.string().optional(),
    billingStateCode: z.string().optional(),
    billingStateName: z.string().optional(),
    billingDistrict: z.string().optional(),
    billingPincode: z.string().optional(),
    shippingSameAsBilling: z.boolean().optional(),
    shippingName: z.string().optional(),
    shippingGstin: z.string().optional(),
    shippingAddress: z.string().optional(),
    shippingCity: z.string().optional(),
    shippingStateCode: z.string().optional(),
    shippingStateName: z.string().optional(),
    shippingDistrict: z.string().optional(),
    shippingPincode: z.string().optional(),
    placeOfSupplyCode: z.string().optional(),
    invoiceDate: z
      .union([z.date(), z.string()])
      .refine((val) => !!val, { message: 'Invoice Date is required' }),
    referenceNumber: z.string().optional(),
    lines: z.array(salesInvoiceLineSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const lines = data.lines || [];

    // Check if at least one valid line exists
    const validLines = lines.filter((line) => line.productId && line.qty && Number(line.qty) > 0);

    if (validLines.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please add at least one valid product line with a quantity greater than 0.',
        path: ['root'], // Using root path for top-level form error
      });
    }

    // Row-level validations
    lines.forEach((line, index) => {
      // If a product is selected, ensure qty and rate are valid
      if (line.productId) {
        if (line.qty === undefined || Number(line.qty) <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Quantity must be > 0',
            path: ['lines', index, 'qty'],
          });
        }
        if (line.rate === undefined || Number(line.rate) < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Rate cannot be negative',
            path: ['lines', index, 'rate'],
          });
        }
      } else {
        // If no product is selected but user entered a qty > 0, warn them
        if (line.qty !== undefined && Number(line.qty) > 0 && line.qty !== 1) {
          // qty is initialized to 1, so we only warn if they explicitly changed it > 1 without a product
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Please select a product first',
            path: ['lines', index, 'productId'],
          });
        }
      }
    });
  });

export type SalesInvoiceFormValues = z.infer<typeof salesInvoiceSchema>;
