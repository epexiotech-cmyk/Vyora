'use client';

import { VoucherDetailDto } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppCard } from '@/components/ui/AppCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function VoucherDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') as string;
  const { context: companyContext, loading: companyLoading } = useCompanyContext();
  const [voucher, setVoucher] = useState<VoucherDetailDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVoucher() {
      try {
        const res = await window.vyora.accounting.getVoucherById(id);
        if (res.success) {
          setVoucher(res.data || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadVoucher();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!voucher) return <div>Voucher not found</div>;

  return (
    <div className="space-y-6">
      <SectionHeader
        title={'Voucher ' + voucher.voucherNumber}
        description="Voucher Detail View (Read Only)"
      />

      <div className="grid grid-cols-2 gap-4">
        <AppCard title="Details">
          <p>
            <strong>Type:</strong> {voucher.voucherType}
          </p>
          <p>
            <strong>Date:</strong> {new Date(voucher.voucherDate).toLocaleDateString()}
          </p>
          <p>
            <strong>Status:</strong> {voucher.isCancelled ? 'Cancelled' : 'Active'}
          </p>
          <p>
            <strong>Narration:</strong> {voucher.narration}
          </p>
        </AppCard>
      </div>

      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold">Entries</h3>
        <table className="w-full border text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-2 text-left">Ledger</th>
              <th className="p-2 text-right">Debit</th>
              <th className="p-2 text-right">Credit</th>
              <th className="p-2 text-left">Narration</th>
            </tr>
          </thead>
          <tbody>
            {voucher.entries?.map((entry) => (
              <tr key={entry.id} className="border-b">
                <td className="p-2">{voucher.ledgerNames?.[entry.ledgerId] || entry.ledgerId}</td>
                <td className="p-2 text-right">
                  {companyLoading || !companyContext?.currency
                    ? ''
                    : formatMoney(entry.debitAmount, companyContext.currency)}
                </td>
                <td className="p-2 text-right">
                  {companyLoading || !companyContext?.currency
                    ? ''
                    : formatMoney(entry.creditAmount, companyContext.currency)}
                </td>
                <td className="p-2">{entry.narration}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/20 font-bold">
            <tr>
              <td className="p-2 text-right">Total</td>
              <td className="p-2 text-right">
                {companyLoading || !companyContext?.currency
                  ? ''
                  : formatMoney(voucher.totalDebit, companyContext.currency)}
              </td>
              <td className="p-2 text-right">
                {companyLoading || !companyContext?.currency
                  ? ''
                  : formatMoney(voucher.totalCredit, companyContext.currency)}
              </td>
              <td className="p-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
