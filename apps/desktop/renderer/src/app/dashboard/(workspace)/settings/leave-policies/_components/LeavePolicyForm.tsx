'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateLeavePolicyInput,
  createLeavePolicySchema,
  LeavePolicyDto,
  EmployeeTypeDto,
  LeaveTypeDto,
  FinancialYearDto,
} from '@vyora/types';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { toast } from 'sonner';

import { AppField } from '@/components/forms/AppField';
import { FormCheckbox } from '@/components/forms/FormCheckbox';
import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';
import { AppButton } from '@/components/ui/AppButton';

interface LeavePolicyFormProps {
  initialData?: LeavePolicyDto | null;
  onClose: () => void;
  onSuccess: () => void;
  createFn: (data: CreateLeavePolicyInput) => Promise<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateFn: (id: string, data: any) => Promise<unknown>;
  employeeTypes: EmployeeTypeDto[];
  leaveTypes: LeaveTypeDto[];
  financialYears: FinancialYearDto[];
}

export function LeavePolicyForm({
  initialData,
  onClose,
  onSuccess,
  createFn,
  updateFn,
  employeeTypes,
  leaveTypes,
  financialYears,
}: LeavePolicyFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const methods = useForm<CreateLeavePolicyInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createLeavePolicySchema) as any,
    defaultValues: initialData || {
      employeeTypeId: '',
      leaveTypeId: '',
      financialYearId: '',
      annualEntitlement: 0,
      maxCarryForward: 0,
      isEncashable: false,
      isActive: true,
    },
  });

  const onSubmit = async (data: CreateLeavePolicyInput) => {
    try {
      setIsSaving(true);
      if (initialData?.id) {
        await updateFn(initialData.id, data);
        toast.success('Leave Policy updated successfully');
      } else {
        await createFn(data);
        toast.success('Leave Policy created successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppField name="financialYearId" label="Financial Year">
            <FormSelect
              name="financialYearId"
              options={financialYears.map((fy) => ({
                label: fy.label,
                value: fy.id,
              }))}
            />
          </AppField>

          <AppField name="employeeTypeId" label="Employee Type">
            <FormSelect
              name="employeeTypeId"
              options={employeeTypes.map((et) => ({
                label: et.name,
                value: et.id,
              }))}
            />
          </AppField>

          <AppField name="leaveTypeId" label="Leave Type">
            <FormSelect
              name="leaveTypeId"
              options={leaveTypes.map((lt) => ({
                label: lt.name,
                value: lt.id,
              }))}
            />
          </AppField>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppField name="annualEntitlement" label="Annual Entitlement">
            <FormInput
              name="annualEntitlement"
              type="number"
              min={0}
              step={0.5}
              placeholder="e.g. 12"
            />
          </AppField>
          <AppField name="maxCarryForward" label="Max Carry Forward">
            <FormInput
              name="maxCarryForward"
              type="number"
              min={0}
              step={0.5}
              placeholder="e.g. 5"
            />
          </AppField>
        </div>

        <div className="flex flex-col gap-4 pt-2">
          <AppField
            name="isEncashable"
            label="Is Encashable"
            description="Can these leaves be encashed at year end?"
          >
            <FormCheckbox name="isEncashable" />
          </AppField>
          <AppField
            name="isActive"
            label="Active Policy"
            description="Policy is active and will be applied"
          >
            <FormCheckbox name="isActive" />
          </AppField>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <AppButton type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </AppButton>
          <AppButton type="submit" disabled={isSaving}>
            {initialData ? 'Update' : 'Create'}
          </AppButton>
        </div>
      </form>
    </FormProvider>
  );
}
