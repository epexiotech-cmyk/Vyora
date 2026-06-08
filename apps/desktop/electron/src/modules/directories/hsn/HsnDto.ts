export interface HsnDto {
  id: number;
  hsnCode: string;
  description: string;
  codeLength: number;
  isInvoiceSelectable: number;
  isActive: boolean | null;
  createdAt?: string | null;
}
