'use client';

import { LeavePolicyDto, EmployeeTypeDto, LeaveTypeDto, FinancialYearDto } from '@vyora/types';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { useLeavePolicies } from '../hooks/useLeavePolicies';

import { LeavePolicyForm } from './LeavePolicyForm';

import { DataTable, ColumnDef, AppModal } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function LeavePolicyList() {
  const {
    data,
    isLoading,
    fetchLeavePolicies,
    createLeavePolicy,
    updateLeavePolicy,
    deleteLeavePolicy,
  } = useLeavePolicies();

  const [employeeTypes, setEmployeeTypes] = React.useState<EmployeeTypeDto[]>([]);
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveTypeDto[]>([]);
  const [financialYears, setFinancialYears] = React.useState<FinancialYearDto[]>([]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingData, setEditingData] = React.useState<LeavePolicyDto | null>(null);

  React.useEffect(() => {
    fetchLeavePolicies();

    // Fetch lookup data
    const fetchLookups = async () => {
      try {
        const [etRes, ltRes, fyRes] = await Promise.all([
          window.vyora.db.employeeTypes.getAll(),
          window.vyora.db.leaveTypes.getAll(),
          window.vyora.financialYear.list(),
        ]);
        if (etRes.success && etRes.data) setEmployeeTypes(etRes.data);
        if (ltRes.success && ltRes.data) setLeaveTypes(ltRes.data);
        if (fyRes.success && fyRes.data) setFinancialYears(fyRes.data);
      } catch (e) {
        console.error('Failed to fetch lookups for Leave Policies', e);
      }
    };
    fetchLookups();
  }, [fetchLeavePolicies]);

  const handleCreateOrEdit = (item?: LeavePolicyDto) => {
    setEditingData(item || null);
    setIsModalOpen(true);
  };

  const handleSuccess = async () => {
    setIsModalOpen(false);
    await fetchLeavePolicies();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this policy?')) {
      try {
        await deleteLeavePolicy(id);
        toast.success('Policy deactivated successfully');
        await fetchLeavePolicies();
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to deactivate policy');
      }
    }
  };

  const columns: ColumnDef<LeavePolicyDto>[] = [
    {
      header: 'Financial Year',
      key: 'financialYearId',
      cell: (val) => financialYears.find((fy) => fy.id === val.financialYearId)?.label || 'Unknown',
    },
    {
      header: 'Employee Type',
      key: 'employeeTypeId',
      cell: (val) => employeeTypes.find((et) => et.id === val.employeeTypeId)?.name || 'Unknown',
    },
    {
      header: 'Leave Type',
      key: 'leaveTypeId',
      cell: (val) => leaveTypes.find((lt) => lt.id === val.leaveTypeId)?.name || 'Unknown',
    },
    {
      header: 'Entitlement',
      key: 'annualEntitlement',
      cell: (val) => val.annualEntitlement,
    },
    {
      header: 'Max CF',
      key: 'maxCarryForward',
      cell: (val) => val.maxCarryForward,
    },
    {
      header: 'Encashable',
      key: 'isEncashable',
      cell: (val) => (val.isEncashable ? 'Yes' : 'No'),
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
        title="Leave Policies"
        description="Configure leave entitlements per employee type"
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
          emptyMessage="No leave policies found."
        />
      </div>

      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingData ? 'Edit Leave Policy' : 'Create Leave Policy'}
      >
        <LeavePolicyForm
          initialData={editingData}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleSuccess}
          createFn={createLeavePolicy}
          updateFn={updateLeavePolicy}
          employeeTypes={employeeTypes}
          leaveTypes={leaveTypes}
          financialYears={financialYears}
        />
      </AppModal>
    </div>
  );
}
