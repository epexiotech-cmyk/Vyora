import { TaxType } from './tax.dto';

export interface GSTRate {
  code: string;
  name: string;
  taxType: TaxType;
  totalRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  description: string;
}

export const GST_RATES: GSTRate[] = [
  {
    code: 'GST_0',
    name: 'GST 0%',
    taxType: 'GST',
    totalRate: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    description: 'Exempt / Zero-Rated',
  },
  {
    code: 'GST_0_1',
    name: 'GST 0.1%',
    taxType: 'GST',
    totalRate: 0.1,
    cgst: 0.05,
    sgst: 0.05,
    igst: 0.1,
    description: 'Merchant Exports',
  },
  {
    code: 'GST_0_25',
    name: 'GST 0.25%',
    taxType: 'GST',
    totalRate: 0.25,
    cgst: 0.125,
    sgst: 0.125,
    igst: 0.25,
    description: 'Rough Diamonds',
  },
  {
    code: 'GST_1',
    name: 'GST 1%',
    taxType: 'GST',
    totalRate: 1,
    cgst: 0.5,
    sgst: 0.5,
    igst: 1,
    description: 'Composition / Housing',
  },
  {
    code: 'GST_1_5',
    name: 'GST 1.5%',
    taxType: 'GST',
    totalRate: 1.5,
    cgst: 0.75,
    sgst: 0.75,
    igst: 1.5,
    description: 'Polished Diamonds',
  },
  {
    code: 'GST_3',
    name: 'GST 3%',
    taxType: 'GST',
    totalRate: 3,
    cgst: 1.5,
    sgst: 1.5,
    igst: 3,
    description: 'Gold / Silver / Jewellery',
  },
  {
    code: 'GST_5',
    name: 'GST 5%',
    taxType: 'GST',
    totalRate: 5,
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
    description: 'Essential Goods / Food',
  },
  {
    code: 'GST_6',
    name: 'GST 6%',
    taxType: 'GST',
    totalRate: 6,
    cgst: 3,
    sgst: 3,
    igst: 6,
    description: 'Service Composition',
  },
  {
    code: 'GST_12',
    name: 'GST 12%',
    taxType: 'GST',
    totalRate: 12,
    cgst: 6,
    sgst: 6,
    igst: 12,
    description: 'Processed Food / Mid-tier',
  },
  {
    code: 'GST_18',
    name: 'GST 18%',
    taxType: 'GST',
    totalRate: 18,
    cgst: 9,
    sgst: 9,
    igst: 18,
    description: 'Standard Rate (IT/Services)',
  },
  {
    code: 'GST_28',
    name: 'GST 28%',
    taxType: 'GST',
    totalRate: 28,
    cgst: 14,
    sgst: 14,
    igst: 28,
    description: 'Luxury Goods / Durables',
  },
  {
    code: 'GST_40',
    name: 'GST 40%',
    taxType: 'GST',
    totalRate: 40,
    cgst: 20,
    sgst: 20,
    igst: 40,
    description: 'Demerit Goods / Gaming',
  },
];
