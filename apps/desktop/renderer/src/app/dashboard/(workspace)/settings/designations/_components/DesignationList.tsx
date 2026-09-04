'use client';

import { DesignationDto } from '@vyora/types';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { useDesignations } from '../hooks/useDesignations';

import { DesignationForm } from './DesignationForm';

import { DataTable, ColumnDef, AppModal } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function DesignationList() {
  const {
    data,
    isLoading,
    fetchDesignations,
    createDesignation,
    updateDesignation,
    deleteDesignation,
  } = useDesignations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingData, setEditingData] = React.useState<DesignationDto | null>(null);

  React.useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  const handleCreateOrEdit = (item?: DesignationDto) => {
    setEditingData(item || null);
    setIsModalOpen(true);
  };

  const handleSuccess = async () => {
    setIsModalOpen(false);
    await fetchDesignations();
  };

  const handleDelete = async (id: string, isSystem?: boolean) => {
    if (isSystem) {
      toast.error('System records cannot be deleted');
      return;
    }
    if (confirm('Are you sure you want to deactivate this record?')) {
      try {
        await deleteDesignation(id);
        toast.success('Record deactivated successfully');
        await fetchDesignations();
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

  const columns: ColumnDef<DesignationDto>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (u) => <div className="flex items-center gap-2 font-medium">{u.name}</div>,
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
        const isSystem = false;
        return (
          <div className="flex justify-end gap-1">
            <AppButton variant="ghost" size="sm" onClick={() => handleCreateOrEdit(u)} title="Edit">
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </AppButton>
            {!isSystem && (
              <AppButton
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(u.id, isSystem)}
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
    <div className="bg-background flex h-full flex-col overflow-hidden">
      <div className="mb-6 flex items-start justify-between">
        <SectionHeader title="Designations" description="Manage job titles and designations." />
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
                Add Designation
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
        title={editingData ? 'Edit Designation' : 'Add Designation'}
        description={editingData ? 'Update the details below.' : 'Create a new record.'}
        hideActions={true}
      >
        <DesignationForm
          initialData={editingData}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          createFn={createDesignation}
          updateFn={updateDesignation}
        />
      </AppModal>
    </div>
  );
}
