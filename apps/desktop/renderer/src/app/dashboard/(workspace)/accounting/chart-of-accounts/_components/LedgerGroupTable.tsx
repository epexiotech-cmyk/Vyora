'use client';

import { LedgerGroupDto } from '@vyora/types';
import { Edit2, Trash2 } from 'lucide-react';
import * as React from 'react';

import { DataTable, ColumnDef } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';

interface LedgerGroupTableProps {
  data: LedgerGroupDto[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onEdit: (group: LedgerGroupDto) => void;
  onDeactivate: (id: string) => void;
  onAdd: () => void;
  page: number;
  onPageChange: (p: number) => void;
  totalRecords: number;
  limit: number;
}

export function LedgerGroupTable({
  data,
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
}: LedgerGroupTableProps) {
  const columns: ColumnDef<LedgerGroupDto>[] = [
    {
      key: 'name',
      header: 'Group Name',
      cell: (g) => (
        <div className="font-medium">
          {g.name}
          {g.isSystemGroup && (
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              System
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'nature',
      header: 'Nature',
      cell: (g) => <div>{g.nature}</div>,
    },
    {
      key: 'isActive',
      header: 'Status',
      cell: (g) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            g.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {g.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (g) => (
        <div className="flex justify-end gap-1">
          <AppButton variant="ghost" size="sm" onClick={() => onEdit(g)} title="Edit">
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </AppButton>
          {!g.isSystemGroup && (
            <AppButton
              variant="ghost"
              size="sm"
              onClick={() => onDeactivate(g.id)}
              title="Deactivate"
            >
              <Trash2 className="text-destructive h-4 w-4" />
              <span className="sr-only">Deactivate</span>
            </AppButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      keyExtractor={(item) => item.id}
      isLoading={isLoading}
      emptyMessage="No ledger groups found."
      toolbar={{
        searchQuery,
        onSearchChange,
        placeholder: 'Search groups...',
        actions: <AppButton onClick={onAdd}>Add Group</AppButton>,
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
