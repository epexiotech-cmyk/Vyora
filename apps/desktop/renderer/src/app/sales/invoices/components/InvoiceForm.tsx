'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';

import { InvoiceHeader } from './InvoiceHeader';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { InvoiceToolbar } from './InvoiceToolbar';
import { InvoiceTotals } from './InvoiceTotals';

import { usePrintPreview } from '@/components/print/usePrintPreview';

// Stub of validation schema, realistically we'd import createSalesInvoiceSchema
const stubSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().optional(),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
  lines: z
    .array(
      z.object({
        productId: z.string().nullable(),
        productName: z.string().optional(),
        qty: z.number().min(1),
        rate: z.number().min(0),
        discountPercent: z.number().min(0).max(100).optional(),
        taxPercent: z.number().min(0).max(100).optional(),
        amount: z.number().min(0),
      }),
    )
    .min(1, 'At least one line item is required'),
});

type InvoiceFormValues = z.infer<typeof stubSchema>;

export interface InvoiceFormProps {
  initialData?: unknown;
  mode: 'create' | 'edit' | 'view';
}

export function InvoiceForm({ initialData, mode }: InvoiceFormProps) {
  const isReadOnly = mode === 'view';

  const methods = useForm<InvoiceFormValues>({
    resolver: zodResolver(stubSchema),
    defaultValues: (initialData as InvoiceFormValues) || {
      customerId: '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      referenceNumber: '',
      remarks: '',
      lines: [
        {
          productId: null,
          productName: '',
          qty: 1,
          rate: 0,
          discountPercent: 0,
          taxPercent: 0,
          amount: 0,
        },
      ],
    },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Print hook
  const { print, printToPdf } = usePrintPreview('sales-invoice-v1', null);

  // Placeholder for calculation state which would normally be fetched via IPC
  const [calculationState] = React.useState({
    totals: {
      subtotal: 0,
      totalDiscount: 0,
      totalTax: 0,
      roundOffAmount: 0,
      grandTotal: 0,
      items: [],
    },
    isCalculating: false,
  });

  const onSubmit = async (data: unknown) => {
    // Call window.vyora.db.sales.createInvoice
    try {
      console.log('Submitting invoice', data);
      // Wait for IPC call...
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrintAction = () => {
    print();
  };

  const handlePdfAction = () => {
    printToPdf();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-background flex h-full flex-col">
        <InvoiceToolbar
          disabled={isReadOnly}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit(onSubmit)}
          onPrint={handlePrintAction}
          onPdf={handlePdfAction}
          onSaveDraft={() => console.log('Save draft')}
          onCancel={() => console.log('Cancel')}
        />

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header section */}
            <div className="bg-card rounded-md border shadow-sm">
              <InvoiceHeader isReadOnly={isReadOnly} />
            </div>

            {/* Line items section */}
            <div className="shadow-sm">
              <InvoiceItemsTable calculationState={calculationState} isReadOnly={isReadOnly} />
            </div>

            {/* Totals section */}
            <div className="flex justify-end">
              <div className="w-full md:w-1/3">
                <InvoiceTotals calculationState={calculationState} />
              </div>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
