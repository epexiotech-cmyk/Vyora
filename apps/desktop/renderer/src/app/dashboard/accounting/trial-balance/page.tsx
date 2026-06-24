'use client';

import { TrialBalanceDto, TrialBalanceRowDto } from '@vyora/types';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { DataTable, ColumnDef } from '@/components/shared/table/DataTable';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function TrialBalance() {
  const [data, setData] = useState<TrialBalanceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await window.vyora.accounting.getTrialBalance();
        if (res.success) {
          setData(res.data || null);
        } else {
          setError(res.error || 'Failed to load Trial Balance');
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Failed to load Trial Balance');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns: ColumnDef<TrialBalanceRowDto>[] = [
    { key: 'ledgerName', header: 'Ledger' },
    {
      key: 'debitTotal',
      header: 'Debit',
      className: 'text-right',
      cell: (row) => (row.debitTotal / 100).toFixed(2),
    },
    {
      key: 'creditTotal',
      header: 'Credit',
      className: 'text-right',
      cell: (row) => (row.creditTotal / 100).toFixed(2),
    },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Trial Balance" description="View Trial Balance" />
        <div className="rounded border border-red-500 bg-red-50 p-4 font-bold text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Trial Balance"
        description="View Trial Balance for the active financial year"
      />

      <div className="overflow-hidden rounded-md border">
        <DataTable
          data={data?.rows || []}
          columns={columns}
          keyExtractor={(item) => item.ledgerId}
          isLoading={loading}
        />
        {!loading && data && (
          <div className="bg-muted/50 flex items-center justify-between border-t p-4 font-bold">
            <div>Total</div>
            <div className="flex space-x-12">
              <div>{(data.totalDebit / 100).toFixed(2)}</div>
              <div>{(data.totalCredit / 100).toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
