'use client';

import { renderDocument, registerAllTemplates } from '@vyora/print-engine';
import { SalesInvoiceDto } from '@vyora/types';
import { ArrowLeft, Loader2, AlertCircle, Printer, FileDown } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { PrintPreview } from '../../../../../components/print/PrintPreview';

// Ensure templates are registered on the client-side
registerAllTemplates();

export default function InvoicePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;

  const [invoice, setInvoice] = useState<SalesInvoiceDto | null>(null);
  const [html, setHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchInvoice() {
      if (!invoiceId) return;
      try {
        setIsLoading(true);
        const response = await window.vyora.db.sales.getById(invoiceId);

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Invoice not found');
        }

        const data = response.data as SalesInvoiceDto;

        if (mounted) {
          setInvoice(data);

          // Render HTML string using print-engine
          const renderedHtml = await renderDocument('gst-invoice-v1', {
            documentType: 'TAX_INVOICE',
            data: data,
          });

          setHtml(renderedHtml);
        }
      } catch (err: unknown) {
        if (mounted) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred while loading the invoice.';
          setError(errorMessage);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchInvoice();

    return () => {
      mounted = false;
    };
  }, [invoiceId]);

  const handleExportPdf = async () => {
    if (isExporting || isPrinting || !html) return;
    try {
      setIsExporting(true);
      const res = await window.vyora.print.exportPdf(html, {
        printBackground: true,
        preferCSSPageSize: true,
      });
      if (res.filePath) {
        toast.success(`PDF exported to: ${res.filePath}`);
      }
    } catch (err: unknown) {
      // IPC throws if user cancels the save dialog, which contains 'net::ERR_ABORTED' usually
      // or we just handle it generically
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes('cancelled') && !msg.includes('net::ERR_ABORTED')) {
        toast.error('Failed to export PDF');
        console.error('Export Error:', err);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    if (isPrinting || isExporting || !html) return;
    try {
      setIsPrinting(true);
      const res = await window.vyora.print.print(html, {
        silent: false,
        printBackground: true,
      });
      if (res.success) {
        toast.success('Document printed successfully');
      } else {
        if (res.failureReason && res.failureReason !== 'cancelled') {
          toast.error(`Print failed: ${res.failureReason}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes('cancelled')) {
        toast.error('An unexpected error occurred during printing');
        console.error('Print Error:', err);
      }
    } finally {
      setIsPrinting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-50">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-500" />
        <h3 className="text-lg font-medium text-neutral-700">Loading Preview...</h3>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-50">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h3 className="text-xl font-bold text-neutral-800">Preview Error</h3>
        <p className="mt-2 max-w-md text-center text-sm text-neutral-600">
          {error || 'Invoice could not be loaded.'}
        </p>
        <button
          onClick={() => router.back()}
          className="mt-6 rounded bg-neutral-200 px-4 py-2 font-medium text-neutral-800 transition-colors hover:bg-neutral-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-neutral-100">
      {/* Header Toolbar */}
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-100"
            title="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="flex items-center gap-2 text-lg font-semibold text-neutral-800">
                Preview: {invoice.invoiceNumber || 'Draft'}
              </h1>
              <span
                className={`rounded border px-2 py-0.5 text-xs font-medium ${
                  invoice.status === 'SUBMITTED'
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : invoice.status === 'CANCELLED'
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {invoice.status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-neutral-500">
              {invoice.billingName || 'Unknown Customer'}
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPdf}
            disabled={isExporting || isPrinting || !html}
            className="flex items-center gap-2 rounded border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>

          <button
            onClick={handlePrint}
            disabled={isPrinting || isExporting || !html}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPrinting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            {isPrinting ? 'Printing...' : 'Print'}
          </button>
        </div>
      </div>

      {/* Preview Component Container */}
      <div className="flex-1 overflow-hidden">
        <PrintPreview
          html={html}
          zoom={0.85}
          title={`Invoice ${invoice.invoiceNumber || 'Draft'}`}
        />
      </div>
    </div>
  );
}
