'use client';

import { ProfitLossPrintAdapter } from '@vyora/print-engine';
import type { ProfitLossReport, ProfitLossGroup } from '@vyora/types';
import { Loader2, Printer, FileDown } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';

import { PrintPreview } from '@/components/print/PrintPreview';
import { usePrintPreview } from '@/components/print/usePrintPreview';
import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AmountCell } from '@/components/reports/AmountCell';

export default function ProfitLossPage() {
  const { context: companyContext } = useCompanyContext();
  const [report, setReport] = useState<ProfitLossReport | null>(null);
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
        // Note: reports APIs return the payload directly, unlike the ApiResponse wrapper in accounting
        const res = await window.vyora.reports.getProfitLoss();
        if (!mounted) return;

        if (res) {
          setReport(res);
        } else {
          setError('Failed to load Profit & Loss statement.');
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
    return ProfitLossPrintAdapter.toPayload(report);
  }, [report]);

  const {
    html: previewHtml,
    isLoading: isGeneratingPreview,
    error: previewError,
    print,
    printToPdf,
  } = usePrintPreview('profit-loss-v1', printPayload);

  if (loading) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        Loading Profit & Loss Statement...
      </div>
    );
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
            <p className="text-muted-foreground text-sm">Profit & Loss Statement</p>
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

  const renderGroup = (group: ProfitLossGroup, depth: number = 0) => {
    const paddingLeft = `${depth * 1.5}rem`;

    return (
      <React.Fragment key={group.groupId}>
        <tr className="bg-muted/30 border-muted/50 border-b font-medium">
          <td
            className="text-foreground p-3"
            style={{ paddingLeft: `calc(0.75rem + ${paddingLeft})` }}
          >
            {group.groupName}
          </td>
          <td className="p-3 text-right">
            <AmountCell
              amount={group.totalBalance.amount}
              type={group.totalBalance.type}
              currency={companyContext!.currency}
              hideType
            />
          </td>
        </tr>
        {group.ledgers.map((ledger) => (
          <tr
            key={ledger.ledgerId}
            className="border-muted/20 hover:bg-muted/10 border-b transition-colors"
          >
            <td
              className="text-muted-foreground p-3"
              style={{ paddingLeft: `calc(2.25rem + ${paddingLeft})` }}
            >
              {ledger.ledgerName}
            </td>
            <td className="p-3 text-right">
              <AmountCell
                amount={ledger.balance.amount}
                type={ledger.balance.type}
                currency={companyContext!.currency}
                hideType
              />
            </td>
          </tr>
        ))}
        {group.subGroups.map((subGroup) => renderGroup(subGroup, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profit & Loss Statement</h1>
          <p className="text-muted-foreground mt-1">
            As of {new Date(report.asOfDate).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => setShowPreview(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors"
        >
          <Printer className="h-4 w-4" />
          Preview / Print
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Expenses Section */}
        <div className="bg-background flex flex-col overflow-hidden rounded-lg border shadow-sm">
          <div className="bg-muted/50 border-b p-4">
            <h2 className="text-lg font-semibold">Expenses</h2>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="p-3 font-semibold">Particulars</th>
                  <th className="p-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.expenseGroups.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-muted-foreground p-6 text-center">
                      No expense entries.
                    </td>
                  </tr>
                ) : (
                  report.expenseGroups.map((group) => renderGroup(group))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-primary/5 mt-auto flex items-center justify-between border-t p-4">
            <span className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
              Total Expense
            </span>
            <span className="text-primary text-lg font-bold">
              <AmountCell
                amount={report.totalExpense.amount}
                type={report.totalExpense.type}
                currency={companyContext!.currency}
                hideType
              />
            </span>
          </div>
        </div>

        {/* Income Section */}
        <div className="bg-background flex flex-col overflow-hidden rounded-lg border shadow-sm">
          <div className="bg-muted/50 border-b p-4">
            <h2 className="text-lg font-semibold">Income</h2>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="p-3 font-semibold">Particulars</th>
                  <th className="p-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {report.incomeGroups.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-muted-foreground p-6 text-center">
                      No income entries.
                    </td>
                  </tr>
                ) : (
                  report.incomeGroups.map((group) => renderGroup(group))
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-primary/5 mt-auto flex items-center justify-between border-t p-4">
            <span className="text-muted-foreground text-sm font-bold tracking-wider uppercase">
              Total Income
            </span>
            <span className="text-primary text-lg font-bold">
              <AmountCell
                amount={report.totalIncome.amount}
                type={report.totalIncome.type}
                currency={companyContext!.currency}
                hideType
              />
            </span>
          </div>
        </div>
      </div>

      {/* Net Result Section */}
      <div
        className={`flex flex-col items-center justify-between rounded-lg border-2 p-6 shadow-sm md:flex-row ${
          report.isProfit
            ? 'border-green-500/20 bg-green-500/10'
            : 'border-red-500/20 bg-red-500/10'
        }`}
      >
        <div>
          <h2 className="text-xl font-bold tracking-tight">Net Result</h2>
          <p
            className={`mt-1 font-medium ${report.isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {report.isProfit ? 'Net Profit' : 'Net Loss'}
          </p>
        </div>
        <div className="mt-4 text-3xl font-black md:mt-0">
          <AmountCell
            amount={report.netResult.amount}
            type={report.netResult.type}
            currency={companyContext!.currency}
            hideType={true}
            className={
              report.isProfit
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }
          />
        </div>
      </div>
    </div>
  );
}
