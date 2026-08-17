'use client';

import { LedgerDto, LedgerGroupDto } from '@vyora/types';
import { Edit2, Trash2 } from 'lucide-react';
import * as React from 'react';

import { DataTable, ColumnDef } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';

interface LedgerTableProps {
  data: LedgerDto[];
  groups: LedgerGroupDto[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onEdit: (ledger: LedgerDto) => void;
  onDeactivate: (id: string) => void;
  onAdd: () => void;
  page: number;
  onPageChange: (p: number) => void;
  totalRecords: number;
  limit: number;
}

export function LedgerTable({
  data,
  groups,
  isLoading,
  searchQuery,
  onSearchChange,
  onEdit,
  onDeactivate,
  onAdd,
  page,
  onPageChange,
  totalRecords,
  limit,
}: LedgerTableProps) {
  const columns: ColumnDef<LedgerDto>[] = [
    {
      key: 'name',
      header: 'Ledger Name',
      cell: (l) => (
        <div className="font-medium">
          {l.name}
          {l.isSystemAccount && (
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              System
            </span>
          )}
          {l.isFrozen && (
            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
              Frozen
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'groupId',
      header: 'Group',
      cell: (l) => {
        const group = groups.find((g) => g.id === l.groupId);
        return <div>{group ? group.name : 'Unknown'}</div>;
      },
    },
    {
      key: 'openingBalance',
      header: 'Opening Balance',
      cell: (l) => (
        <div>
          ₹{(l.openingBalance / 100).toFixed(2)} {l.openingType}
        </div>
      ),
    },
    {
      key: 'referenceType',
      header: 'Type',
      cell: (l) => (
        <span className="text-sm text-gray-500">
          {l.referenceType === 'MANUAL' ? 'General' : l.referenceType}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      cell: (l) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            l.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {l.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (l) => {
        const isProtected =
          l.isSystemAccount ||
          l.referenceType === 'CUSTOMER' ||
          l.referenceType === 'SUPPLIER' ||
          l.isFrozen;

        return (
          <div className="flex justify-end gap-1">
            <AppButton
              variant="ghost"
              size="sm"
              onClick={() => onEdit(l)}
              title={isProtected ? 'View' : 'Edit'}
            >
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </AppButton>
            {!isProtected && (
              <AppButton
                variant="ghost"
                size="sm"
                onClick={() => onDeactivate(l.id)}
                title="Deactivate"
              >
                <Trash2 className="text-destructive h-4 w-4" />
                <span className="sr-only">Deactivate</span>
              </AppButton>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      emptyMessage="No ledgers found."
      toolbar={{
        searchQuery,
        onSearchChange,
        placeholder: 'Search ledgers...',
        actions: <AppButton onClick={onAdd}>Add Ledger</AppButton>,
      }}
      pagination={{
        page,
        pageSize: limit,
        totalRecords,
        onPageChange,
      }}
    />
  );
}
