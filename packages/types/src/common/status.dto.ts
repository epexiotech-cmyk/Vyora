import { z } from 'zod';

export const InvoiceStatus = z.enum(['DRAFT', 'SUBMITTED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']);
export type InvoiceStatus = z.infer<typeof InvoiceStatus>;
