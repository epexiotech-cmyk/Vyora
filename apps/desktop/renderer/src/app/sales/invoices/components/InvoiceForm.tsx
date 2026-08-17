'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { createSalesInvoiceSchema } from '@vyora/types';
import { SalesInvoiceDto } from '@vyora/types';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { InvoiceHeader } from './InvoiceHeader';
import { InvoiceItemsTable } from './InvoiceItemsTable';
import { InvoiceMapper, normalizeError } from './InvoiceMapper';
import { InvoiceToolbar } from './InvoiceToolbar';
import { InvoiceTotals } from './InvoiceTotals';
import { useLeaveWarning } from './useLeaveWarning';

import { ConstrainedSection } from '@/components/layout/ConstrainedSection';
import { usePrintPreview } from '@/components/print/usePrintPreview';

type InvoiceFormValues = z.input<typeof createSalesInvoiceSchema>;

export interface InvoiceFormProps {
  initialData?: SalesInvoiceDto;
  mode: 'create' | 'edit' | 'view';
}

export function InvoiceForm({ initialData, mode }: InvoiceFormProps) {
  const isReadOnly = mode === 'view';

  const methods = useForm<InvoiceFormValues>({
    resolver: zodResolver(createSalesInvoiceSchema),
    defaultValues: (initialData as InvoiceFormValues) || {
      companyId: '00000000-0000-0000-0000-000000000000',
      financialYearId: '00000000-0000-0000-0000-000000000000',
      customerId: '',
      invoiceNumber: '',
      invoiceDate: new Date(),
      isReverseCharge: false,
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      roundOffAmount: 0,
      grandTotal: 0,
      items: [
        {
          productId: '00000000-0000-0000-0000-000000000000',
          unitId: '00000000-0000-0000-0000-000000000000',
          taxId: '00000000-0000-0000-0000-000000000000',
          quantity: 1,
          rate: 0,
          taxableAmount: 0,
          taxAmount: 0,
          lineTotal: 0,
        },
      ],
    },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isDirty },
    getValues,
  } = methods;

  useLeaveWarning(isDirty);

  // Status for toolbar rules (e.g. DRAFT or SUBMITTED)
  const invoiceStatus = initialData?.status || 'DRAFT';
  const invoiceId = initialData?.id;

  // Print hook
  const { print, printToPdf } = usePrintPreview('sales-invoice-v1', null);

  const [isVoiding, setIsVoiding] = React.useState(false);

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

  const onSubmit = async (data: InvoiceFormValues) => {
    try {
      const companyId = '00000000-0000-0000-0000-000000000000'; // To be loaded from context
      const fyId = '00000000-0000-0000-0000-000000000000'; // To be loaded from context

      const payload = InvoiceMapper.formToCreateDto(data, companyId, fyId, calculationState);

      if (mode === 'create') {
        const res = await window.vyora.db.sales.createInvoice(payload);
        if (!res.success) throw new Error(res.error || 'Failed to create invoice');

        if (res.data) {
          // Immediately submit since they clicked Submit (not Save Draft)
          const submitRes = await window.vyora.db.sales.submitInvoice(res.data.invoiceId);
          if (!submitRes.success) throw new Error(submitRes.error || 'Failed to submit invoice');
        }
      } else if (invoiceId) {
        // Update draft first
        const updateRes = await window.vyora.db.sales.updateDraft(invoiceId, payload);
        if (!updateRes.success) throw new Error(updateRes.error || 'Failed to update draft');

        // Submit
        const submitRes = await window.vyora.db.sales.submitInvoice(invoiceId);
        if (!submitRes.success) throw new Error(submitRes.error || 'Failed to submit invoice');
      }

      toast.success('Invoice submitted successfully');
    } catch (e) {
      const uiErr = normalizeError(e);
      toast.error(uiErr.message);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const data = getValues();
      const companyId = '00000000-0000-0000-0000-000000000000';
      const fyId = '00000000-0000-0000-0000-000000000000';

      const payload = InvoiceMapper.formToCreateDto(data, companyId, fyId, calculationState);

      if (mode === 'create') {
        const res = await window.vyora.db.sales.createInvoice(payload);
        if (!res.success) throw new Error(res.error || 'Failed to create draft');
      } else if (invoiceId) {
        const res = await window.vyora.db.sales.updateDraft(invoiceId, payload);
        if (!res.success) throw new Error(res.error || 'Failed to update draft');
      }

      toast.success('Draft saved successfully');
    } catch (e) {
      const uiErr = normalizeError(e);
      toast.error(uiErr.message);
    }
  };

  const handleVoidInvoice = async () => {
    if (!invoiceId) return;

    const confirmMessage = `Void this invoice?\n\nThis action will reverse:\n• Inventory movements\n• Accounting journals\n\nThis operation cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsVoiding(true);
      const res = await window.vyora.db.sales.cancelInvoice(invoiceId);
      if (!res.success) throw new Error(res.error || 'Failed to void invoice');

      toast.success('Invoice voided successfully');
      // Refresh UI so status becomes CANCELLED
      window.location.reload();
    } catch (e) {
      const uiErr = normalizeError(e);
      toast.error(uiErr.message);
      setIsVoiding(false);
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
          isSubmitting={isSubmitting || isVoiding}
          invoiceStatus={invoiceStatus}
          onSubmit={handleSubmit(onSubmit)}
          onPrint={handlePrintAction}
          onPdf={handlePdfAction}
          onSaveDraft={handleSaveDraft}
          onVoidInvoice={handleVoidInvoice}
          onCancel={() => window.history.back()}
        />

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="w-full space-y-6">
            {/* Header section */}
            <ConstrainedSection>
              <div className="bg-card rounded-md border shadow-sm">
                <InvoiceHeader isReadOnly={isReadOnly} />
              </div>
            </ConstrainedSection>

            {/* Line items section */}
            <div className="shadow-sm">
              <InvoiceItemsTable calculationState={calculationState} isReadOnly={isReadOnly} />
            </div>

            {/* Totals section */}
            <ConstrainedSection>
              <div className="flex justify-end">
                <div className="w-full lg:max-w-xl">
                  <InvoiceTotals calculationState={calculationState} />
                </div>
              </div>
            </ConstrainedSection>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
