'use client';

import { VoucherListItemDto } from '@vyora/types';
import { Eye, XCircle, RotateCcw } from 'lucide-react';
import * as React from 'react';

import { DataTable, ColumnDef } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';

interface JournalTableProps {
  data: VoucherListItemDto[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onView: (id: string) => void;
  onCancel: (id: string) => void;
  onReverse: (id: string) => void;
  onAdd: () => void;
}

export function JournalTable({
  data,
  isLoading,
  searchQuery,
  onSearchChange,
  onView,
  onCancel,
  onReverse,
  onAdd,
}: JournalTableProps) {
  const columns: ColumnDef<VoucherListItemDto>[] = [
    {
      key: 'voucherDate',
      header: 'Date',
      cell: (v) => new Date(v.voucherDate).toLocaleDateString(),
    },
    {
      key: 'voucherNumber',
      header: 'Voucher No',
      cell: (v) => (
        <div className="font-medium">
          {v.voucherNumber}
          {v.isCancelled && (
            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
              Cancelled
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'narration',
      header: 'Narration',
      cell: (v) => <span className="line-clamp-1 text-gray-600">{v.narration || '-'}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      cell: (v) => `₹ ${(v.totalAmount / 100).toFixed(2)}`,
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (v) => (
        <div className="flex items-center gap-2">
          <AppButton variant="ghost" size="icon" onClick={() => onView(v.id)} title="View">
            <Eye className="h-4 w-4" />
          </AppButton>
          {!v.isCancelled && (
            <>
              <AppButton variant="ghost" size="icon" onClick={() => onCancel(v.id)} title="Cancel">
                <XCircle className="h-4 w-4 text-red-500" />
              </AppButton>
              <AppButton
                variant="ghost"
                size="icon"
                onClick={() => onReverse(v.id)}
                title="Reverse"
              >
                <RotateCcw className="h-4 w-4 text-orange-500" />
              </AppButton>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <input
            type="text"
            placeholder="Search journals..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-[250px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <AppButton onClick={onAdd}>New Journal Entry</AppButton>
      </div>

      <div className="rounded-md border bg-white">
        <DataTable columns={columns} data={data} isLoading={isLoading} keyExtractor={(v) => v.id} />
      </div>
    </div>
  );
}
