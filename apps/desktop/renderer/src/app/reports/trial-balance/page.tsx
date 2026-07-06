'use client';

import type { TrialBalanceDto } from '@vyora/types';
import React, { useEffect, useState } from 'react';

import { AmountCell } from '@/components/reports/AmountCell';

export default function TrialBalancePage() {
  const [report, setReport] = useState<TrialBalanceDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <div className="text-muted-foreground p-8 text-center">Loading Trial Balance...</div>;
  }

  if (error) {
    return <div className="text-destructive p-8 text-center">Error: {error}</div>;
  }

  if (!report) {
    return <div className="text-muted-foreground p-8 text-center">No data available.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Trial Balance</h1>
        <p className="text-muted-foreground">Live Statement</p>
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
                    <AmountCell amount={row.debitTotal} hideType />
                  </td>
                  <td className="p-3 text-right">
                    <AmountCell amount={row.creditTotal} hideType />
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
                  <AmountCell amount={report.totalDebit} hideType />
                </td>
                <td className="text-primary p-3 text-right">
                  <AmountCell amount={report.totalCredit} hideType />
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
