'use client';

import { TrialBalancePrintAdapter } from '@vyora/print-engine';
import type { TrialBalanceDto } from '@vyora/types';
import { Loader2, Printer, FileDown } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';

import { PrintPreview } from '@/components/print/PrintPreview';
import { usePrintPreview } from '@/components/print/usePrintPreview';
import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AmountCell } from '@/components/reports/AmountCell';

export default function TrialBalancePage() {
  const { context: companyContext } = useCompanyContext();
  const [report, setReport] = useState<TrialBalanceDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchReport() {
      try {
        setLoading(true);
        const res = await window.vyora.accounting.getTrialBalance();
        if (!mounted) return;

        if (res.success && res.data) {
          setReport(res.data);
        } else {
          setError(res.error || 'Failed to load Trial Balance');
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchReport();
    return () => {
      mounted = false;
    };
  }, []);

  const printPayload = useMemo(() => {
    if (!report) return null;
    return TrialBalancePrintAdapter.toPayload(report);
  }, [report]);

  const {
    html: previewHtml,
    isLoading: isGeneratingPreview,
    error: previewError,
    print,
    printToPdf,
  } = usePrintPreview('trial-balance-v1', printPayload);

  if (loading) {
    return <div className="text-muted-foreground p-8 text-center">Loading Trial Balance...</div>;
  }

  if (error) {
    return <div className="text-destructive p-8 text-center">Error: {error}</div>;
  }

  if (!report) {
    return <div className="text-muted-foreground p-8 text-center">No data available.</div>;
  }

  if (showPreview) {
    return (
      <div className="flex h-screen flex-col bg-slate-50">
        <div className="bg-background flex items-center justify-between border-b px-6 py-4 shadow-sm">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Print Preview</h1>
            <p className="text-muted-foreground text-sm">Trial Balance</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(false)}
              className="hover:bg-accent hover:text-accent-foreground rounded-md px-4 py-2 text-sm font-medium transition-colors"
            >
              Back to Report
            </button>
            <button
              onClick={async () => {
                try {
                  setIsExporting(true);
                  await printToPdf();
                } finally {
                  setIsExporting(false);
                }
              }}
              disabled={isGeneratingPreview || !!previewError || isExporting}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Export PDF
            </button>
            <button
              onClick={async () => {
                try {
                  setIsPrinting(true);
                  await print();
                } finally {
                  setIsPrinting(false);
                }
              }}
              disabled={isGeneratingPreview || !!previewError || isPrinting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {isPrinting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              Print
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-6">
          <PrintPreview html={previewHtml} isLoading={isGeneratingPreview} error={previewError} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trial Balance</h1>
          <p className="text-muted-foreground">Live Statement</p>
        </div>
        <button
          onClick={() => setShowPreview(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors"
        >
          <Printer className="h-4 w-4" />
          Preview / Print
        </button>
      </div>

      <div className="bg-background overflow-hidden rounded-lg border shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            <tr>
              <th className="p-3 font-semibold">Ledger Name</th>
              <th className="p-3 text-right font-semibold">Debit Balance</th>
              <th className="p-3 text-right font-semibold">Credit Balance</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-muted-foreground p-4 text-center">
                  No balances to display.
                </td>
              </tr>
            ) : (
              report.rows.map((row) => (
                <tr key={row.ledgerId} className="hover:bg-muted/10 border-b transition-colors">
                  <td className="text-foreground p-3 font-medium">{row.ledgerName}</td>
                  <td className="p-3 text-right">
                    <AmountCell
                      amount={row.debitTotal}
                      currency={companyContext!.currency}
                      hideType
                    />
                  </td>
                  <td className="p-3 text-right">
                    <AmountCell
                      amount={row.creditTotal}
                      currency={companyContext!.currency}
                      hideType
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {report.rows.length > 0 && (
            <tfoot className="bg-primary/5 border-t font-bold">
              <tr>
                <td className="p-3 text-right text-xs tracking-wider uppercase">Grand Total</td>
                <td className="text-primary p-3 text-right">
                  <AmountCell
                    amount={report.totalDebit}
                    currency={companyContext!.currency}
                    hideType
                  />
                </td>
                <td className="text-primary p-3 text-right">
                  <AmountCell
                    amount={report.totalCredit}
                    currency={companyContext!.currency}
                    hideType
                  />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {!report.isBalanced && (
        <div className="bg-destructive/10 text-destructive border-destructive/20 mt-4 rounded-md border p-4 font-medium">
          Warning: Trial Balance is not balanced! There is a difference between Total Debit and
          Total Credit.
        </div>
      )}
    </div>
  );
}
