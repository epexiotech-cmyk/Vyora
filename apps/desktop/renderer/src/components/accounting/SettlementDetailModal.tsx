'use client';

import { SettlementDto } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import { Loader2, FileDown, Printer, Share2, X } from 'lucide-react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import { usePrintPreview } from '@/components/print/usePrintPreview';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface SettlementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlementId: string | null;
}

export function SettlementDetailModal({
  isOpen,
  onClose,
  settlementId,
}: SettlementDetailModalProps) {
  const [data, setData] = React.useState<SettlementDto | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const isPayment = data?.settlementType === 'PAYMENT';
  const templateId = isPayment ? 'payment-v1' : 'receipt-v1';

  const {
    print,
    printToPdf,
    saveTempPdfAndShare,
    isLoading: isPdfLoading,
  } = usePrintPreview(
    templateId,
    data ? { documentType: isPayment ? 'PAYMENT' : 'RECEIPT', data } : null,
  );
  const [isExporting, setIsExporting] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const [isPrinting, setIsPrinting] = React.useState(false);

  const handleExportPdf = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      const res = await printToPdf({
        printBackground: true,
        pageSize: 'A4',
      });
      const blob = new Blob([res], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${isPayment ? 'Payment' : 'Receipt'}-${data.settlementNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSharePdf = async () => {
    if (!data) return;
    setIsSharing(true);
    try {
      const fileName = `${isPayment ? 'Payment' : 'Receipt'}-${data.settlementNumber}.pdf`;
      const res = await saveTempPdfAndShare(fileName, {
        printBackground: true,
        pageSize: 'A4',
      });

      if (res.success) {
        toast.success('PDF generated. Opening folder to share...');
      } else {
        throw new Error(res.error || 'Failed to save and share PDF');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to share PDF');
    } finally {
      setIsSharing(false);
    }
  };

  const handlePrint = async () => {
    if (!data) return;
    setIsPrinting(true);
    try {
      const res = await print({
        printBackground: true,
        pageSize: 'A4',
      });
      if (res.success) {
        toast.success('Print job sent successfully');
      } else {
        throw new Error(res.failureReason || 'Failed to print document');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to print document');
    } finally {
      setIsPrinting(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && settlementId) {
      const fetchDetails = async () => {
        setIsLoading(true);
        try {
          const res = await window.vyora.accounting.getSettlementById(settlementId);
          if (res.success && res.data) {
            setData(res.data);
          } else {
            toast.error('Failed to load settlement details');
            onClose();
          }
        } catch (error) {
          const err = error as Error;
          toast.error(err.message || 'An error occurred');
          onClose();
        } finally {
          setIsLoading(false);
        }
      };

      fetchDetails();
    }
  }, [isOpen, settlementId, onClose]);

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex h-screen w-screen overflow-hidden bg-neutral-100">
      {/* Left Pane: Document Preview */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-300 bg-white px-6 py-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="truncate text-lg font-medium text-neutral-800">
              Preview: {data?.settlementNumber || (isPayment ? 'Payment' : 'Receipt')}
            </h2>
          </div>
        </div>

        <div className="relative flex flex-1 items-start justify-center overflow-auto p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center pt-20">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-600" />
              <p className="text-neutral-500">Loading document...</p>
            </div>
          ) : !data ? (
            <div className="pt-20 text-neutral-500">No data available</div>
          ) : (
            <div className="mb-8 flex min-h-[297mm] w-[210mm] shrink-0 flex-col bg-white p-8 shadow-lg sm:p-12">
              {/* Document Header */}
              <div className="mb-6 flex items-start justify-between border-b pb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">
                    {isPayment ? 'PAYMENT VOUCHER' : 'RECEIPT VOUCHER'}
                  </h1>
                  <p className="mt-1 font-medium text-gray-500">{data.settlementNumber}</p>
                </div>
                <div className="text-right">
                  <StatusBadge
                    variant={
                      data.status === 'COMPLETED'
                        ? 'success'
                        : data.status === 'CANCELLED'
                          ? 'destructive'
                          : 'default'
                    }
                  >
                    {data.status}
                  </StatusBadge>
                </div>
              </div>

              {/* Document Details */}
              <div className="mb-8 grid grid-cols-2 gap-8">
                <div>
                  <h4 className="mb-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    {isPayment ? 'Paid To' : 'Received From'}
                  </h4>
                  <p className="text-base font-semibold text-gray-900">{data.partyName}</p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Payment Account
                  </h4>
                  <p className="text-base font-semibold text-gray-900">{data.paymentAccountName}</p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Date
                  </h4>
                  <p className="text-base font-medium text-gray-800">
                    {new Date(data.settlementDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Reference Number
                  </h4>
                  <p className="text-base font-medium text-gray-800">
                    {data.referenceNumber || '—'}
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Reference Date
                  </h4>
                  <p className="text-base font-medium text-gray-800">
                    {data.referenceDate ? new Date(data.referenceDate).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {data.notes && (
                <div className="mb-8 rounded border bg-gray-50 p-4 text-sm text-gray-800">
                  <strong>Notes:</strong> {data.notes}
                </div>
              )}

              {/* Allocations Table */}
              {data.allocations && data.allocations.length > 0 && (
                <div className="mb-8">
                  <h4 className="mb-3 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Allocations
                  </h4>
                  <table className="w-full border-collapse border border-gray-200 text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="border-r border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-600">
                          Document No
                        </th>
                        <th className="border-r border-gray-200 px-4 py-2.5 text-left font-semibold text-gray-600">
                          Date
                        </th>
                        <th className="border-r border-gray-200 px-4 py-2.5 text-right font-semibold text-gray-600">
                          Total
                        </th>
                        <th className="border-r border-gray-200 px-4 py-2.5 text-right font-semibold text-gray-600">
                          Allocated
                        </th>
                        <th className="border-r border-gray-200 px-4 py-2.5 text-right font-semibold text-gray-600">
                          Balance
                        </th>
                        <th className="px-4 py-2.5 text-center font-semibold text-gray-600">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.allocations.map((alloc) => {
                        const isFullyAllocated =
                          alloc.documentBalance !== undefined &&
                          alloc.documentBalance - alloc.allocatedAmount <= 0;
                        return (
                          <tr key={alloc.id} className="border-b border-gray-100 last:border-b-0">
                            <td className="border-r border-gray-100 px-4 py-2.5 text-gray-900">
                              <span className="font-medium">
                                {alloc.documentNumber || alloc.documentId.split('-')[0]}
                              </span>
                              <div className="mt-0.5 text-[10px] text-gray-400 uppercase">
                                {alloc.documentType.replace('_', ' ')}
                              </div>
                            </td>
                            <td className="border-r border-gray-100 px-4 py-2.5 text-gray-600">
                              {alloc.documentDate
                                ? new Date(alloc.documentDate).toLocaleDateString()
                                : '—'}
                            </td>
                            <td className="border-r border-gray-100 px-4 py-2.5 text-right text-gray-900">
                              {alloc.documentTotal !== undefined
                                ? formatMoney(alloc.documentTotal)
                                : '—'}
                            </td>
                            <td className="border-r border-gray-100 px-4 py-2.5 text-right font-semibold text-gray-900">
                              {formatMoney(alloc.allocatedAmount)}
                            </td>
                            <td className="border-r border-gray-100 px-4 py-2.5 text-right text-gray-600">
                              {alloc.documentBalance !== undefined
                                ? formatMoney(alloc.documentBalance)
                                : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${isFullyAllocated ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                              >
                                {isFullyAllocated ? 'FULL' : 'PARTIAL'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Document Totals */}
              <div className="mt-auto flex justify-end border-t pt-6">
                <div className="w-72 space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span className="text-xs font-bold uppercase">Total Allocated</span>
                    <span>{formatMoney(data.allocatedAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span className="text-xs font-bold uppercase">Unallocated</span>
                    <span>{formatMoney(data.unallocatedAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold text-gray-900">
                    <span className="text-sm uppercase">
                      Total {isPayment ? 'Payment' : 'Receipt'}
                    </span>
                    <span>{formatMoney(data.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Action Panel */}
      <div className="z-10 flex w-80 shrink-0 flex-col overflow-y-auto border-l border-neutral-300 bg-white shadow-sm">
        <div className="p-6">
          <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-900 uppercase">Actions</h3>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSharePdf}
              disabled={isPdfLoading || isSharing || !data || data.status !== 'COMPLETED'}
              className="flex w-full items-center justify-center gap-2 rounded bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSharing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {isSharing ? 'Generating...' : 'Share PDF'}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isPdfLoading || isExporting || !data || data.status !== 'COMPLETED'}
              className="flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              {isExporting ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              onClick={handlePrint}
              disabled={isPdfLoading || isPrinting || !data || data.status !== 'COMPLETED'}
              className="flex w-full items-center justify-center gap-2 rounded border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPrinting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              {isPrinting ? 'Printing...' : 'Print'}
            </button>
          </div>

          {data && (
            <div className="mt-10">
              <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-900 uppercase">
                Summary
              </h3>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase">
                    {isPayment ? 'Paid To' : 'Received From'}
                  </div>
                  <div className="mt-0.5 font-medium text-gray-900">{data.partyName}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase">Payment Account</div>
                  <div className="mt-0.5 font-medium text-gray-900">{data.paymentAccountName}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase">Date</div>
                  <div className="mt-0.5 font-medium text-gray-900">
                    {new Date(data.settlementDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase">Reference Date</div>
                  <div className="mt-0.5 font-medium text-gray-900">
                    {data.referenceDate ? new Date(data.referenceDate).toLocaleDateString() : '—'}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="mb-1 flex justify-between text-gray-600">
                    <span>Allocated</span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(data.allocatedAmount)}
                    </span>
                  </div>
                  <div className="mb-2 flex justify-between text-gray-600">
                    <span>Unallocated</span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(data.unallocatedAmount)}
                    </span>
                  </div>
                  <div className="-mx-2 flex justify-between rounded border-t border-indigo-100 bg-indigo-50/50 p-2 text-base font-bold text-indigo-700">
                    <span>Total</span>
                    <span>{formatMoney(data.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
