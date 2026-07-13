'use client';

import { Save, Printer, FileText, Send, X, Ban } from 'lucide-react';
import * as React from 'react';

import { AppButton } from '@/components/ui/AppButton';

export interface InvoiceToolbarProps {
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  onPrint?: () => void;
  onPdf?: () => void;
  onCancel?: () => void;
  onVoidInvoice?: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  invoiceStatus?: string;
}

export function InvoiceToolbar({
  onSaveDraft,
  onSubmit,
  onPrint,
  onPdf,
  onCancel,
  onVoidInvoice,
  isSubmitting,
  disabled,
  invoiceStatus = 'DRAFT',
}: InvoiceToolbarProps) {
  const canPrint = invoiceStatus === 'SUBMITTED';

  return (
    <div className="flex items-center justify-between border-b p-4">
      <h1 className="text-xl font-bold">Sales Invoice</h1>
      <div className="flex space-x-2">
        <AppButton variant="outline" onClick={onCancel} disabled={disabled || isSubmitting}>
          <X className="mr-2 h-4 w-4" /> Cancel
        </AppButton>
        {invoiceStatus === 'SUBMITTED' && (
          <AppButton
            variant="destructive"
            onClick={onVoidInvoice}
            disabled={disabled || isSubmitting || !onVoidInvoice}
          >
            <Ban className="mr-2 h-4 w-4" /> Void Invoice
          </AppButton>
        )}
        {invoiceStatus === 'DRAFT' && (
          <AppButton
            variant="secondary"
            onClick={onSaveDraft}
            disabled={disabled || isSubmitting || !onSaveDraft}
          >
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </AppButton>
        )}
        <AppButton
          variant="secondary"
          onClick={onPrint}
          disabled={disabled || isSubmitting || !onPrint || !canPrint}
        >
          <Printer className="mr-2 h-4 w-4" /> Print
        </AppButton>
        <AppButton
          variant="secondary"
          onClick={onPdf}
          disabled={disabled || isSubmitting || !onPdf || !canPrint}
        >
          <FileText className="mr-2 h-4 w-4" /> PDF
        </AppButton>
        {invoiceStatus === 'DRAFT' && (
          <AppButton
            variant="default"
            onClick={onSubmit}
            disabled={disabled || isSubmitting || !onSubmit}
          >
            <Send className="mr-2 h-4 w-4" /> Submit
          </AppButton>
        )}
      </div>
    </div>
  );
}
