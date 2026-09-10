'use client';

import { SalaryComponentDto } from '@vyora/types';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { useSalaryComponents } from '../hooks/useSalaryComponents';

import { SalaryComponentForm } from './SalaryComponentForm';

import { DataTable, ColumnDef, AppModal } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function SalaryComponentList() {
  const {
    data,
    isLoading,
    fetchSalaryComponents,
    createSalaryComponent,
    updateSalaryComponent,
    deactivateSalaryComponent,
  } = useSalaryComponents();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingData, setEditingData] = React.useState<SalaryComponentDto | null>(null);

  React.useEffect(() => {
    fetchSalaryComponents();
  }, [fetchSalaryComponents]);

  const handleCreateOrEdit = (item?: SalaryComponentDto) => {
    setEditingData(item || null);
    setIsModalOpen(true);
  };

  const handleSuccess = async () => {
    setIsModalOpen(false);
    await fetchSalaryComponents();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this component?')) {
      try {
        await deactivateSalaryComponent(id);
        toast.success('Component deactivated successfully');
        await fetchSalaryComponents();
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to deactivate component');
      }
    }
  };

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data;
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(
      (u: SalaryComponentDto) =>
        u.name.toLowerCase().includes(lowerQuery) || u.code.toLowerCase().includes(lowerQuery),
    );
  }, [data, searchQuery]);

  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * limit;
    return filteredData.slice(start, start + limit);
  }, [filteredData, page, limit]);

  const columns: ColumnDef<SalaryComponentDto>[] = [
    {
      key: 'code',
      header: 'Code',
    },
    {
      key: 'name',
      header: 'Name',
      cell: (u) => <div className="font-medium">{u.name}</div>,
    },
    {
      key: 'category',
      header: 'Category',
      cell: (u) => (
        <div>
          {u.category === 'Earning' ? (
            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">Earning</span>
          ) : (
            <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">Deduction</span>
          )}
        </div>
      ),
    },
    {
      key: 'calculation',
      header: 'Calculation',
      cell: (u) => {
        if (u.calculationType === 'Fixed') return 'Fixed Amount';
        if (u.calculationBase === 'SpecificComponent') return 'Percentage of Component';
        return `Percentage of ${u.calculationBase}`;
      },
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
        <SectionHeader
          title="Salary Components"
          description="Manage global earnings and deductions for employee salary structures."
        />
      </div>

      <div className="flex-1 overflow-auto">
        <DataTable
          data={paginatedData}
          columns={columns}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No components found."
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
                Add Component
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
        title={editingData ? 'Edit Salary Component' : 'Add Salary Component'}
        description={
          editingData
            ? 'Update the details for this salary component.'
            : 'Configure a new earning or deduction component.'
        }
        hideActions={true}
      >
        <SalaryComponentForm
          initialData={editingData}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          createFn={createSalaryComponent}
          updateFn={updateSalaryComponent}
          allComponents={data}
        />
      </AppModal>
    </div>
  );
}
