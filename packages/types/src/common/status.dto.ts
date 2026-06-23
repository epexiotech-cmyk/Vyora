import { z } from 'zod';

export const InvoiceStatus = z.enum(['DRAFT', 'SUBMITTED', 'CANCELLED']);
export type InvoiceStatus = z.infer<typeof InvoiceStatus>;
