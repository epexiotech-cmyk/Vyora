'use client';

import { WeeklyOffPolicyDto, EmployeeTypeDto } from '@vyora/types';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { useWeeklyOffPolicies } from '../hooks/useWeeklyOffPolicies';

import { WeeklyOffPolicyForm } from './WeeklyOffPolicyForm';

import { DataTable, ColumnDef, AppModal } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function WeeklyOffPolicyList() {
  const {
    data,
    isLoading,
    fetchWeeklyOffPolicies,
    createWeeklyOffPolicy,
    updateWeeklyOffPolicy,
    deleteWeeklyOffPolicy,
  } = useWeeklyOffPolicies();

  const [employeeTypes, setEmployeeTypes] = React.useState<EmployeeTypeDto[]>([]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingData, setEditingData] = React.useState<WeeklyOffPolicyDto | null>(null);

  React.useEffect(() => {
    fetchWeeklyOffPolicies();

    // Fetch lookup data
    const fetchLookups = async () => {
      try {
        const etRes = await window.vyora.db.employeeTypes.getAll();
        if (etRes.success && etRes.data) setEmployeeTypes(etRes.data);
      } catch (e) {
        console.error('Failed to fetch lookups for Weekly Off Policies', e);
      }
    };
    fetchLookups();
  }, [fetchWeeklyOffPolicies]);

  const handleCreateOrEdit = (item?: WeeklyOffPolicyDto) => {
    if (item) {
      setEditingData({
        ...item,
        // @ts-expect-error type assertion for form string mapping
        dayOfWeek: String(item.dayOfWeek),
      });
    } else {
      setEditingData(null);
    }
    setIsModalOpen(true);
  };

  const handleSuccess = async () => {
    setIsModalOpen(false);
    await fetchWeeklyOffPolicies();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this policy?')) {
      try {
        await deleteWeeklyOffPolicy(id);
        toast.success('Policy deactivated successfully');
        await fetchWeeklyOffPolicies();
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to deactivate policy');
      }
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const columns: ColumnDef<WeeklyOffPolicyDto>[] = [
    {
      header: 'Employee Type',
      key: 'employeeTypeId',
      cell: (val) => employeeTypes.find((et) => et.id === val.employeeTypeId)?.name || 'Unknown',
    },
    {
      header: 'Day of Week',
      key: 'dayOfWeek',
      cell: (val) => dayNames[val.dayOfWeek] || 'Unknown',
    },
    {
      header: 'Is Half Day',
      key: 'isHalfDay',
      cell: (val) => (val.isHalfDay ? 'Yes' : 'No'),
    },
    {
      header: 'Status',
      key: 'isActive',
      cell: (val) => (val.isActive ? 'Active' : 'Inactive'),
    },
    {
      header: 'Actions',
      key: 'actions',
      cell: (row) => (
        <div className="flex gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            onClick={() => handleCreateOrEdit(row)}
            className="text-primary-600 hover:text-primary-700"
          >
            <Edit2 className="h-4 w-4" />
          </AppButton>
          <AppButton
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </AppButton>
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <SectionHeader
        title="Weekly Off Policies"
        description="Configure weekly off days per employee type"
      >
        <AppButton onClick={() => handleCreateOrEdit()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Policy
        </AppButton>
      </SectionHeader>

      <div className="mt-4 flex-1">
        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          emptyMessage="No weekly off policies found."
        />
      </div>

      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingData ? 'Edit Weekly Off Policy' : 'Create Weekly Off Policy'}
      >
        <WeeklyOffPolicyForm
          initialData={editingData}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          createFn={createWeeklyOffPolicy}
          updateFn={updateWeeklyOffPolicy}
          employeeTypes={employeeTypes}
        />
      </AppModal>
    </div>
  );
}
