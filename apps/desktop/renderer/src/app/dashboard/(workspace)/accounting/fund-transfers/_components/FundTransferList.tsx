import { FundTransferDto, FundTransferQueryFilter, TransferTypeEnum } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import { Plus, Undo2, Pencil } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { useFundTransfers } from '../hooks/useFundTransfers';

import { DataTable, ColumnDef } from '@/components/shared';
import { AppSelect } from '@/components/shared/form/AppSelect';
import { AppInput as Input } from '@/components/ui/AppInput';
import { Button } from '@/components/ui/button';
import { StatusBadge as Badge } from '@/components/ui/StatusBadge';

interface FundTransferListProps {
  onNew: () => void;
  onEdit: (transfer: FundTransferDto) => void;
}

export function FundTransferList({ onNew, onEdit }: FundTransferListProps) {
  const [filters, setFilters] = useState<FundTransferQueryFilter>({});
  const { data, isLoading, reverseTransfer } = useFundTransfers(filters);

  const handleReverse = useCallback(
    async (id: string) => {
      if (confirm('Are you sure you want to reverse this fund transfer?')) {
        await reverseTransfer(id);
      }
    },
    [reverseTransfer],
  );

  const transfers = data?.data || [];

  const columns = React.useMemo<ColumnDef<FundTransferDto>[]>(
    () => [
      {
        key: 'transferDate',
        header: 'Date',
        cell: (item: FundTransferDto) =>
          new Date(item.transferDate).toLocaleDateString('en-GB').split('/').join('-'),
      },
      {
        key: 'voucherNumber',
        header: 'Voucher #',
        cell: (item: FundTransferDto) => item.voucherNumber,
      },
      {
        key: 'transfer',
        header: 'Transfer',
        cell: (item: FundTransferDto) =>
          `${item.sourceAccountName} → ${item.destinationAccountName}`,
      },
      {
        key: 'amount',
        header: 'Amount',
        cell: (item: FundTransferDto) => (
          <div className="text-right font-medium">{formatCurrency(item.amount)}</div>
        ),
        className: 'text-right',
      },
      {
        key: 'isCancelled',
        header: 'Status',
        cell: (item: FundTransferDto) =>
          item.isCancelled ? (
            <Badge variant="destructive">Reversed</Badge>
          ) : (
            <Badge variant="outline" className="border-green-600 text-green-600">
              Active
            </Badge>
          ),
      },
      {
        key: 'actions',
        header: 'Actions',
        cell: (item: FundTransferDto) => (
          <div className="flex justify-end gap-2">
            {!item.isCancelled && (
              <>
                <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleReverse(item.id)}>
                  <Undo2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ),
        className: 'text-right',
      },
    ],
    [onEdit, handleReverse],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Fund Transfers</h2>
        <Button onClick={onNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Transfer
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by Voucher #"
          value={filters.voucherNumber || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFilters({ ...filters, voucherNumber: e.target.value })
          }
          className="w-[200px]"
        />
        <AppSelect
          value={filters.transferType || 'ALL'}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const val = e.target.value;
            setFilters({
              ...filters,
              transferType:
                val === 'ALL' ? undefined : (val as import('@vyora/types').TransferType),
            });
          }}
          className="w-[180px]"
          options={[
            { label: 'All Types', value: 'ALL' },
            ...TransferTypeEnum.map((type) => ({ label: type, value: type })),
          ]}
        />
        <AppSelect
          value={filters.isActive !== undefined ? filters.isActive.toString() : 'ALL'}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const val = e.target.value;
            if (val === 'ALL') setFilters({ ...filters, isActive: undefined });
            else setFilters({ ...filters, isActive: val === 'true' });
          }}
          className="w-[180px]"
          options={[
            { label: 'All Statuses', value: 'ALL' },
            { label: 'Active', value: 'true' },
            { label: 'Reversed', value: 'false' },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-md border">
        <DataTable
          columns={columns}
          data={transfers}
          keyExtractor={(item: FundTransferDto) => item.id}
          isLoading={isLoading}
          emptyMessage="No fund transfers found."
        />
      </div>
    </div>
  );
}
