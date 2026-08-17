'use client';

import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';

import {
  useJournalVoucher,
  useCancelJournalVoucher,
  useReverseJournalVoucher,
} from '../hooks/useJournal';

import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function ViewJournalEntryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: voucher, isLoading, fetchVoucher } = useJournalVoucher(id);

  React.useEffect(() => {
    fetchVoucher();
  }, [fetchVoucher]);

  const { mutateAsync: cancelVoucher } = useCancelJournalVoucher();
  const { mutateAsync: reverseVoucher } = useReverseJournalVoucher();

  if (isLoading) {
    return <div>Loading voucher...</div>;
  }

  if (!voucher) {
    return <div>Voucher not found</div>;
  }

  const handleCancel = async () => {
    if (confirm('Are you sure you want to cancel this journal voucher?')) {
      try {
        await cancelVoucher(id);
        router.push('/dashboard/accounting/journal');
      } catch {
        // Error handled in hook
      }
    }
  };

  const handleReverse = async () => {
    if (
      confirm(
        'Are you sure you want to reverse this journal voucher? A new reversal voucher will be posted.',
      )
    ) {
      try {
        await reverseVoucher(id);
        router.push('/dashboard/accounting/journal');
      } catch {
        // Error handled in hook
      }
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`Journal Entry: ${voucher.voucherNumber}`}
        description="View journal entry details"
      />

      <div className="rounded-md border bg-white p-6 shadow-sm">
        <div className="mb-8 grid grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Date</h4>
            <p className="mt-1 text-base text-gray-900">
              {new Date(voucher.voucherDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Status</h4>
            <p className="mt-1 text-base">
              {voucher.isCancelled ? (
                <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  Cancelled
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Active
                </span>
              )}
            </p>
          </div>
          <div className="col-span-2">
            <h4 className="text-sm font-medium text-gray-500">Narration</h4>
            <p className="mt-1 text-base text-gray-900">{voucher.narration || '-'}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Ledger Account
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-900"
                >
                  Debit (₹)
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-900"
                >
                  Credit (₹)
                </th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                  Narration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {voucher.entries?.map((entry: import('@vyora/types').VoucherEntryDto) => {
                const ledgerName = voucher.ledgerNames?.[entry.ledgerId] || 'Unknown Ledger';
                return (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-900">
                      {ledgerName}
                    </td>
                    <td className="px-4 py-3 text-right text-sm whitespace-nowrap text-gray-500">
                      {entry.debitAmount > 0 ? (entry.debitAmount / 100).toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm whitespace-nowrap text-gray-500">
                      {entry.creditAmount > 0 ? (entry.creditAmount / 100).toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-500">
                      {entry.narration || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <th
                  scope="row"
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-900"
                >
                  Total
                </th>
                <td className="px-4 py-3 text-right text-sm font-bold whitespace-nowrap text-gray-900">
                  {(voucher.totalDebit / 100).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold whitespace-nowrap text-gray-900">
                  {(voucher.totalCredit / 100).toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {!voucher.isCancelled && (
          <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">
            <AppButton type="button" variant="outline" onClick={handleCancel}>
              Cancel Voucher
            </AppButton>
            <AppButton type="button" variant="outline" onClick={handleReverse}>
              Reverse Voucher
            </AppButton>
          </div>
        )}
      </div>
    </div>
  );
}
