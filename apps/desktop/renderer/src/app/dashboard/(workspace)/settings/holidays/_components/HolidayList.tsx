'use client';

import { HolidayDto } from '@vyora/types';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { useHolidays } from '../hooks/useHolidays';

import { HolidayForm } from './HolidayForm';

import { DataTable, ColumnDef, AppModal } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function HolidayList() {
  const { data, isLoading, fetchHolidays, createHoliday, updateHoliday, deleteHoliday } =
    useHolidays();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingData, setEditingData] = React.useState<HolidayDto | null>(null);

  React.useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleCreateOrEdit = (item?: HolidayDto) => {
    setEditingData(item || null);
    setIsModalOpen(true);
  };

  const handleSuccess = async () => {
    setIsModalOpen(false);
    await fetchHolidays();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this record?')) {
      try {
        await deleteHoliday(id);
        toast.success('Record deactivated successfully');
        await fetchHolidays();
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to deactivate record');
      }
    }
  };

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter((u) => u.name.toLowerCase().includes(lowerQuery));
  }, [data, searchQuery]);

  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * limit;
    return filteredData.slice(start, start + limit);
  }, [filteredData, page, limit]);

  const columns: ColumnDef<HolidayDto>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (u) => <div className="flex items-center gap-2 font-medium">{u.name}</div>,
    },
    {
      key: 'date',
      header: 'Date',
      cell: (u) => (
        <div>
          {new Date(u.date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (u) => (
        <div>
          {u.isActive ? (
            <span className="text-green-600">Active</span>
          ) : (
            <span className="text-red-500">Inactive</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      cell: (u) => {
        return (
          <div className="flex justify-end gap-1">
            <AppButton variant="ghost" size="sm" onClick={() => handleCreateOrEdit(u)} title="Edit">
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </AppButton>
            <AppButton
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(u.id)}
              title="Deactivate"
            >
              <Trash2 className="text-destructive h-4 w-4" />
              <span className="sr-only">Deactivate</span>
            </AppButton>
          </div>
        );
      },
    },
  ];

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      <div className="mb-6 flex items-start justify-between">
        <SectionHeader title="Holidays" description="Manage company holidays and observances." />
      </div>

      <div className="flex-1 overflow-auto">
        <DataTable
          data={paginatedData}
          columns={columns}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No records found."
          toolbar={{
            searchQuery,
            onSearchChange: (val) => {
              setSearchQuery(val);
              setPage(1);
            },
            placeholder: 'Search...',
            actions: (
              <AppButton onClick={() => handleCreateOrEdit()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Holiday
              </AppButton>
            ),
          }}
          pagination={{
            page,
            pageSize: limit,
            totalRecords: filteredData.length,
            onPageChange: setPage,
          }}
        />
      </div>

      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingData ? 'Edit Holiday' : 'Add Holiday'}
        description={editingData ? 'Update the details below.' : 'Create a new record.'}
        hideActions={true}
      >
        <HolidayForm
          initialData={editingData}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          createFn={createHoliday}
          updateFn={updateHoliday}
        />
      </AppModal>
    </div>
  );
}
