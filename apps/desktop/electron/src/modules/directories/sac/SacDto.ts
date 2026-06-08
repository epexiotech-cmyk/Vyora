export interface SacDto {
  id: number;
  sacCode: string;
  description: string;
  codeLength: number;
  isInvoiceSelectable: number;
  isActive: boolean | null;
  createdAt: string | null;
}
