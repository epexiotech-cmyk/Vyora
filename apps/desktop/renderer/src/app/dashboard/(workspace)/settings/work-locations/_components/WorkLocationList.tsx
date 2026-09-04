'use client';

import { WorkLocationDto } from '@vyora/types';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { useWorkLocations } from '../hooks/useWorkLocations';

import { WorkLocationForm } from './WorkLocationForm';

import { DataTable, ColumnDef, AppModal } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function WorkLocationList() {
  const {
    data,
    isLoading,
    fetchWorkLocations,
    createWorkLocation,
    updateWorkLocation,
    deleteWorkLocation,
  } = useWorkLocations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingData, setEditingData] = React.useState<WorkLocationDto | null>(null);

  React.useEffect(() => {
    fetchWorkLocations();
  }, [fetchWorkLocations]);

  const handleCreateOrEdit = (item?: WorkLocationDto) => {
    setEditingData(item || null);
    setIsModalOpen(true);
  };

  const handleSuccess = async () => {
    setIsModalOpen(false);
    await fetchWorkLocations();
  };

  const handleDelete = async (id: string, isSystem?: boolean) => {
    if (isSystem) {
      toast.error('System records cannot be deleted');
      return;
    }
    if (confirm('Are you sure you want to deactivate this record?')) {
      try {
        await deleteWorkLocation(id);
        toast.success('Record deactivated successfully');
        await fetchWorkLocations();
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

  const columns: ColumnDef<WorkLocationDto>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (u) => <div className="flex items-center gap-2 font-medium">{u.name}</div>,
    },

    {
      key: 'address',
      header: 'Address',
      cell: (u) => <div>{u.address || '-'}</div>,
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
        <SectionHeader
          title="Work Locations"
          description="Manage branch offices and work locations."
        />
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
                Add Work Location
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
        title={editingData ? 'Edit Work Location' : 'Add Work Location'}
        description={editingData ? 'Update the details below.' : 'Create a new record.'}
        hideActions={true}
      >
        <WorkLocationForm
          initialData={editingData}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          createFn={createWorkLocation}
          updateFn={updateWorkLocation}
        />
      </AppModal>
    </div>
  );
}
