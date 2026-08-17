'use client';

import { SalesInvoicePrintAdapter } from '@vyora/print-engine';
import type { SalesInvoiceDto } from '@vyora/types';
import { ArrowLeft, Loader2, AlertCircle, Printer, FileDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';

import { PrintPreview } from '../../../../components/print/PrintPreview';
import { usePrintPreview } from '../../../../components/print/usePrintPreview';
import { useCompanyContext } from '../../../../components/providers/CompanyContextProvider';

export default function InvoicePreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams?.get('id') as string;
  const { context: companyContext } = useCompanyContext();

  const [invoice, setInvoice] = useState<SalesInvoiceDto | null>(null);
  const [isFetchingInvoice, setIsFetchingInvoice] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printers, setPrinters] = useState<import('electron').PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    async function loadPrinters() {
      try {
        const list = await window.vyora.print.getAvailablePrinters();
        if (mounted && list) {
          setPrinters(list);
          const defaultPrinter = list.find((p) => p.isDefault);
          if (defaultPrinter) setSelectedPrinter(defaultPrinter.name);
          else if (list.length > 0) setSelectedPrinter(list[0].name);
        }
      } catch (err) {
        console.error('Failed to load printers:', err);
      }
    }
    loadPrinters();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function fetchInvoice() {
      if (!invoiceId) return;
      try {
        setIsFetchingInvoice(true);
        const response = await window.vyora.db.sales.getById(invoiceId);

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Invoice not found');
        }

        if (mounted) {
          setInvoice(response.data as SalesInvoiceDto);
        }
      } catch (err: unknown) {
        if (mounted) {
          setFetchError(err instanceof Error ? err.message : 'Failed to load invoice');
        }
      } finally {
        if (mounted) {
          setIsFetchingInvoice(false);
        }
      }
    }

    fetchInvoice();

    return () => {
      mounted = false;
    };
  }, [invoiceId]);

  const printPayload = useMemo(() => {
    if (!invoice) return null;
    const payload = SalesInvoicePrintAdapter.toPayload(invoice);
    if (companyContext?.company?.logoPath) {
      const data = payload.data as typeof payload.data & {
        companyId?: string;
        companyLogoPath?: string;
      };
      data.companyLogoPath = companyContext.company.logoPath;
      data.companyId = companyContext.company.id;
    }
    return payload;
  }, [invoice, companyContext]);

  const {
    html,
    isLoading: isGeneratingPreview,
    error: previewError,
    print,
    printToPdf,
  } = usePrintPreview('gst-invoice-v1', printPayload);

  const handleExportPdf = async () => {
    if (isExporting || isPrinting || !html) return;
    try {
      setIsExporting(true);
      const res = await printToPdf({
        printBackground: true,
        preferCSSPageSize: true,
      });
      // Convert returned ArrayBuffer to Blob and trigger browser download
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice?.invoiceNumber || 'Draft'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('PDF exported successfully');
    } catch (err: unknown) {
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
      await print({
        silent: !!selectedPrinter,
        deviceName: selectedPrinter || undefined,
        printBackground: true,
      });
      toast.success('Document printed successfully');
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

  if (isFetchingInvoice) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-50">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-500" />
        <h3 className="text-lg font-medium text-neutral-700">Loading Invoice...</h3>
      </div>
    );
  }

  if (fetchError || !invoice) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-50">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h3 className="text-xl font-bold text-neutral-800">Preview Error</h3>
        <p className="mt-2 max-w-md text-center text-sm text-neutral-600">
          {fetchError || 'Invoice could not be loaded.'}
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
    <div className="flex h-full w-full overflow-hidden bg-neutral-100">
      {/* Left Sidebar */}
      <div className="z-10 flex w-80 shrink-0 flex-col border-r border-neutral-200 bg-white shadow-sm">
        <div className="flex-1 overflow-y-auto p-6">
          <button
            onClick={() => router.back()}
            className="mb-4 flex w-fit items-center gap-2 rounded-md text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h1 className="mb-3 text-xl leading-tight font-semibold text-neutral-800">
            Preview: <br /> {invoice.invoiceNumber || 'Draft'}
          </h1>

          <div className="mb-6">
            <span
              className={`rounded border px-2 py-1 text-xs font-medium ${
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

          <div className="text-sm">
            <div className="mb-1 font-semibold text-neutral-700">Customer</div>
            <div className="text-neutral-600">{invoice.billingName || 'Unknown Customer'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex shrink-0 flex-col gap-3 border-t border-neutral-200 bg-neutral-50/50 p-6">
          <div className="mb-2 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-600">Select Printer</label>
            <select
              value={selectedPrinter}
              onChange={(e) => setSelectedPrinter(e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">System Dialog (Default)</option>
              {printers.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.displayName || p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportPdf}
            disabled={isExporting || isPrinting || !html}
            className="flex w-full items-center justify-center gap-2 rounded border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
          isLoading={isGeneratingPreview}
          error={previewError}
        />
      </div>
    </div>
  );
}
