'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  UpdateEmployeeLeaveBalanceInput,
  CreateEmployeeLeaveBalanceSchema,
  EmployeeLeaveBalanceDto,
  LeaveTypeDto,
  FinancialYearDto,
} from '@vyora/types';
import { Calendar, Edit, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { toast } from 'sonner';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';
import { DataTable, ColumnDef } from '@/components/shared';
import { AppModal } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';

interface EmployeeLeaveBalancesProps {
  employeeId: string;
}

export function EmployeeLeaveBalances({ employeeId }: EmployeeLeaveBalancesProps) {
  const [balances, setBalances] = React.useState<EmployeeLeaveBalanceDto[]>([]);
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveTypeDto[]>([]);
  const [financialYears, setFinancialYears] = React.useState<FinancialYearDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      await Promise.resolve(); // Avoid synchronous setState within effect
      setIsLoading(true);
      const [balRes, ltRes, fyRes] = await Promise.all([
        window.vyora.db.employeeLeaveBalances.search({ employeeId, pageSize: 100 }),
        window.vyora.db.leaveTypes.getAll(),
        window.vyora.financialYear.list(),
      ]);
      if (balRes.success && balRes.data) {
        setBalances(balRes.data.data);
      }
      if (ltRes.success && ltRes.data) {
        setLeaveTypes(ltRes.data);
      }
      if (fyRes.success && fyRes.data) {
        setFinancialYears(fyRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load leave balances');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  React.useEffect(() => {
    const handleRefresh = () => {
      void loadData();
    };
    window.addEventListener('vyora:refreshLeaveBalances', handleRefresh);
    return () => {
      window.removeEventListener('vyora:refreshLeaveBalances', handleRefresh);
    };
  }, [loadData]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this leave balance?')) return;
    try {
      const res = await window.vyora.db.employeeLeaveBalances.delete(id);
      if (res.success) {
        toast.success('Leave balance deleted');
        loadData();
      } else {
        toast.error(res.error || 'Failed to delete leave balance');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting leave balance');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const methods = useForm<any>({
    resolver: zodResolver(CreateEmployeeLeaveBalanceSchema),
    defaultValues: {
      employeeId,
      leaveTypeId: '',
      financialYearId: '',
      openingBalance: 0,
      carriedForward: 0,
      allotted: 0,
      used: 0,
      pending: 0,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    try {
      let res;
      if (editingId) {
        res = await window.vyora.db.employeeLeaveBalances.update(
          editingId,
          data as UpdateEmployeeLeaveBalanceInput,
        );
      } else {
        res = await window.vyora.db.employeeLeaveBalances.create(data);
      }

      if (res.success) {
        toast.success(editingId ? 'Balance updated' : 'Balance created');
        setIsModalOpen(false);
        setEditingId(null);
        methods.reset();
        loadData();
      } else {
        toast.error(res.error || 'Failed to save balance');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving balance');
    }
  };

  const handleEdit = (balance: EmployeeLeaveBalanceDto) => {
    setEditingId(balance.id);
    methods.reset({
      employeeId: balance.employeeId,
      leaveTypeId: balance.leaveTypeId,
      financialYearId: balance.financialYearId,
      openingBalance: balance.openingBalance,
      carriedForward: balance.carriedForward,
      allotted: balance.allotted,
      used: balance.used,
      pending: balance.pending,
    });
    setIsModalOpen(true);
  };

  const columns: ColumnDef<EmployeeLeaveBalanceDto>[] = [
    {
      key: 'financialYearId',
      header: 'Financial Year',
      cell: (row) => {
        const fy = financialYears.find((f) => f.id === row.financialYearId);
        return fy ? fy.label : 'Unknown';
      },
    },
    {
      key: 'leaveTypeId',
      header: 'Leave Type',
      cell: (row) => {
        const lt = leaveTypes.find((l) => l.id === row.leaveTypeId);
        return lt ? lt.name : 'Unknown';
      },
    },
    { key: 'openingBalance', header: 'Opening' },
    { key: 'carriedForward', header: 'Carry Fwd' },
    { key: 'allotted', header: 'Allotted' },
    { key: 'used', header: 'Used' },
    { key: 'pending', header: 'Pending' },
    { key: 'remaining', header: 'Remaining' },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <AppButton variant="ghost" size="sm" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
          </AppButton>
          <AppButton
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.id)}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </AppButton>
        </div>
      ),
    },
  ];

  return (
    <AppCard className="p-6 shadow-sm md:col-span-2">
      <div className="mb-4 flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground h-5 w-5" />
          <h3 className="text-lg font-medium">Leave Balances</h3>
        </div>
        <AppButton
          size="sm"
          onClick={() => {
            setEditingId(null);
            methods.reset({
              employeeId,
              leaveTypeId: '',
              financialYearId: '',
              openingBalance: 0,
              carriedForward: 0,
              allotted: 0,
              used: 0,
              pending: 0,
            });
            setIsModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Balance
        </AppButton>
      </div>

      <DataTable
        columns={columns}
        data={balances}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
      />

      <AppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Leave Balance' : 'Add Leave Balance'}
      >
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <AppField name="financialYearId" label="Financial Year">
              <FormSelect
                name="financialYearId"
                options={financialYears.map((f) => ({ value: f.id, label: f.label }))}
              />
            </AppField>
            <AppField name="leaveTypeId" label="Leave Type">
              <FormSelect
                name="leaveTypeId"
                options={leaveTypes.map((l) => ({ value: l.id, label: l.name }))}
              />
            </AppField>
            <div className="grid grid-cols-2 gap-4">
              <AppField name="openingBalance" label="Opening Balance">
                <FormInput name="openingBalance" type="number" step="0.5" />
              </AppField>
              <AppField name="carriedForward" label="Carried Forward">
                <FormInput name="carriedForward" type="number" step="0.5" />
              </AppField>
              <AppField name="allotted" label="Allotted">
                <FormInput name="allotted" type="number" step="0.5" />
              </AppField>
              <AppField name="used" label="Used">
                <FormInput name="used" type="number" step="0.5" />
              </AppField>
              <AppField name="pending" label="Pending">
                <FormInput name="pending" type="number" step="0.5" />
              </AppField>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <AppButton variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </AppButton>
              <AppButton type="submit">Save</AppButton>
            </div>
          </form>
        </FormProvider>
      </AppModal>
    </AppCard>
  );
}
