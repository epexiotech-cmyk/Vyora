'use client';

import { SettlementListRowDto, SettlementType } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import { Plus, Search, Eye, Pencil, Ban } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { SettlementDetailModal } from '@/components/accounting/SettlementDetailModal';
import { RecordSettlementDialog } from '@/components/forms/RecordSettlementDialog';
import { DataTable, ColumnDef } from '@/components/shared';
import { AppModal } from '@/components/shared/modal/AppModal';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface SettlementListProps {
  type: SettlementType;
}

export function SettlementList({ type }: SettlementListProps) {
  const [data, setData] = React.useState<SettlementListRowDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [itemToCancel, setItemToCancel] = React.useState<SettlementListRowDto | null>(null);
  const [itemToEdit, setItemToEdit] = React.useState<string | null>(null);

  const [isRecordDialogOpen, setIsRecordDialogOpen] = React.useState(false);

  // Detail Modal State
  const [itemToView, setItemToView] = React.useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  const isPayment = type === 'PAYMENT';
  const title = isPayment ? 'Payments' : 'Receipts';
  const actionLabel = isPayment ? 'Record Payment' : 'Record Receipt';

  const fetchSettlements = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await window.vyora.accounting.listSettlements({
        type,
        limit,
        offset: (page - 1) * limit,
      });
      if (res.success && res.data) {
        let filtered = res.data.data;

        if (searchQuery.trim()) {
          const lowerQ = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (s) =>
              s.settlementNumber.toLowerCase().includes(lowerQ) ||
              s.partyName.toLowerCase().includes(lowerQ) ||
              (s.referenceNumber && s.referenceNumber.toLowerCase().includes(lowerQ)),
          );
        }

        setData(filtered);
        setTotal(res.data.total);
      } else {
        toast.error(`Failed to load ${title.toLowerCase()}`);
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || `An error occurred while loading ${title.toLowerCase()}`);
    } finally {
      setIsLoading(false);
    }
  }, [type, page, limit, searchQuery, title]);

  React.useEffect(() => {
    queueMicrotask(() => fetchSettlements());
  }, [fetchSettlements]);

  const handleCancel = async () => {
    if (!itemToCancel) return;
    try {
      const res = await window.vyora.accounting.cancelSettlement(itemToCancel.id);
      if (res.success) {
        toast.success(`${isPayment ? 'Payment' : 'Receipt'} cancelled successfully`);
        setItemToCancel(null);
        fetchSettlements();
      } else {
        toast.error('Failed to cancel');
      }
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Failed to cancel');
    }
  };

  const columns: ColumnDef<SettlementListRowDto>[] = [
    {
      header: 'Date',
      key: 'settlementDate',
      cell: (row) => new Date(row.settlementDate).toLocaleDateString(),
    },
    {
      header: 'No.',
      key: 'settlementNumber',
      cell: (row) => row.settlementNumber,
    },
    {
      header: isPayment ? 'Supplier' : 'Customer',
      key: 'partyName',
      cell: (row) => row.partyName,
    },
    {
      header: 'Account',
      key: 'paymentAccountName',
      cell: (row) => row.paymentAccountName,
    },
    {
      header: 'Amount',
      key: 'amount',
      cell: (row) => formatMoney(row.amount),
    },
    {
      header: 'Status',
      key: 'status',
      cell: (row) => (
        <StatusBadge
          variant={
            row.status === 'COMPLETED'
              ? 'success'
              : row.status === 'CANCELLED'
                ? 'destructive'
                : 'default'
          }
        >
          {row.status}
        </StatusBadge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <AppButton
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setItemToView(row.id)}
            title="View"
            aria-label="View"
          >
            <Eye className="h-4 w-4" />
          </AppButton>

          <AppButton
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setItemToEdit(row.id)}
            disabled={row.status !== 'COMPLETED'}
            title="Edit"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </AppButton>

          <AppButton
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            onClick={() => setItemToCancel(row)}
            disabled={row.status !== 'COMPLETED'}
            title="Cancel"
            aria-label="Cancel"
          >
            <Ban className="h-4 w-4" />
          </AppButton>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col space-y-4">
      <SectionHeader
        title={title}
        actions={
          <AppButton onClick={() => setIsRecordDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {actionLabel}
          </AppButton>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-9 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <DataTable
          columns={columns}
          data={data}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage={`No ${title.toLowerCase()} found`}
          pagination={{
            page,
            pageSize: limit,
            totalRecords: total,
            onPageChange: setPage,
          }}
        />
      </div>

      <AppModal
        isOpen={!!itemToCancel}
        onClose={() => setItemToCancel(null)}
        onConfirm={handleCancel}
        title={`Cancel ${isPayment ? 'Payment' : 'Receipt'}?`}
        description="Are you sure you want to cancel this settlement? This will reverse the accounting voucher and restore the outstanding balances of allocated invoices/bills."
        confirmLabel="Yes, Cancel"
      />

      <SettlementDetailModal
        isOpen={!!itemToView}
        onClose={() => setItemToView(null)}
        settlementId={itemToView}
      />

      <RecordSettlementDialog
        isOpen={isRecordDialogOpen || !!itemToEdit}
        onClose={() => {
          setIsRecordDialogOpen(false);
          setItemToEdit(null);
        }}
        type={type}
        editId={itemToEdit ?? undefined}
        onSuccess={fetchSettlements}
      />
    </div>
  );
}
