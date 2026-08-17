import { GeneralLedgerStatement } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import * as React from 'react';

interface GeneralLedgerSummaryProps {
  statements: GeneralLedgerStatement[];
}

export function GeneralLedgerSummary({ statements }: GeneralLedgerSummaryProps) {
  let netOpening = 0;
  let totalDebit = 0;
  let totalCredit = 0;
  let netClosing = 0;

  statements.forEach((stmt) => {
    // Opening
    const op = stmt.openingBalance;
    if (op.type === 'Dr') {
      netOpening += op.amount;
    } else {
      netOpening -= op.amount;
    }

    // Closing
    const cl = stmt.closingBalance;
    if (cl.type === 'Dr') {
      netClosing += cl.amount;
    } else {
      netClosing -= cl.amount;
    }

    // Entries total
    stmt.entries.forEach((e) => {
      totalDebit += e.debitAmount;
      totalCredit += e.creditAmount;
    });
  });

  const absOpening = Math.abs(netOpening);
  const typeOpening = netOpening >= 0 ? 'Dr' : 'Cr';

  const absClosing = Math.abs(netClosing);
  const typeClosing = netClosing >= 0 ? 'Dr' : 'Cr';

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Opening Balance</p>
        <p className="mt-1 text-2xl font-semibold">
          {formatCurrency(absOpening)}{' '}
          <span className="text-sm font-normal text-gray-500">{typeOpening}</span>
        </p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Total Debit</p>
        <p className="mt-1 text-2xl font-semibold text-green-600">{formatCurrency(totalDebit)}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Total Credit</p>
        <p className="mt-1 text-2xl font-semibold text-red-600">{formatCurrency(totalCredit)}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Closing Balance</p>
        <p className="mt-1 text-2xl font-semibold">
          {formatCurrency(absClosing)}{' '}
          <span className="text-sm font-normal text-gray-500">{typeClosing}</span>
        </p>
      </div>
    </div>
  );
}
