import { GeneralLedgerStatement } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import * as React from 'react';

interface GeneralLedgerTableProps {
  statement: GeneralLedgerStatement;
}

export function GeneralLedgerTable({ statement }: GeneralLedgerTableProps) {
  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Ledger Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h3 className="text-lg font-medium text-gray-900">{statement.ledgerName}</h3>
        <div className="text-sm">
          <span className="mr-2 text-gray-500">Opening Balance:</span>
          <span className="font-semibold">
            {formatCurrency(statement.openingBalance.amount)}{' '}
            <span className="font-normal text-gray-500">{statement.openingBalance.type}</span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Voucher No
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Particulars
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Debit (Dr)
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Credit (Cr)
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Running Balance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {statement.entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No transactions in this period.
                </td>
              </tr>
            ) : (
              statement.entries.map((entry) => (
                <tr key={entry.entryId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                    {new Intl.DateTimeFormat('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(entry.voucherDate))}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                    {entry.voucherNumber}
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                    {entry.voucherType}
                  </td>
                  <td
                    className="max-w-xs truncate px-6 py-4 text-sm text-gray-500"
                    title={entry.narration}
                  >
                    {entry.narration || '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-green-600">
                    {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm whitespace-nowrap text-red-600">
                    {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap text-gray-900">
                    {formatCurrency(entry.runningBalance.amount)}{' '}
                    <span className="font-normal text-gray-500">{entry.runningBalance.type}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="border-t border-gray-200 bg-gray-50">
            <tr>
              <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                Closing Balance:
              </td>
              <td colSpan={3} className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                {formatCurrency(statement.closingBalance.amount)}{' '}
                <span className="font-normal text-gray-500">{statement.closingBalance.type}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
