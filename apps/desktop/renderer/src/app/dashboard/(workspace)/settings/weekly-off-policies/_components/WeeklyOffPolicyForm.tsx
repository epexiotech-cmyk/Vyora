'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateWeeklyOffPolicyInput,
  createWeeklyOffPolicySchema,
  WeeklyOffPolicyDto,
  EmployeeTypeDto,
} from '@vyora/types';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { toast } from 'sonner';

import { AppField } from '@/components/forms/AppField';
import { FormCheckbox } from '@/components/forms/FormCheckbox';
import { FormSelect } from '@/components/forms/FormSelect';
import { AppButton } from '@/components/ui/AppButton';

interface WeeklyOffPolicyFormProps {
  initialData?: WeeklyOffPolicyDto | null;
  onClose: () => void;
  onSuccess: () => void;
  createFn: (data: CreateWeeklyOffPolicyInput) => Promise<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateFn: (id: string, data: any) => Promise<unknown>;
  employeeTypes: EmployeeTypeDto[];
}

export function WeeklyOffPolicyForm({
  initialData,
  onClose,
  onSuccess,
  createFn,
  updateFn,
  employeeTypes,
}: WeeklyOffPolicyFormProps) {
  const [isSaving, setIsSaving] = React.useState(false);

  const methods = useForm<CreateWeeklyOffPolicyInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createWeeklyOffPolicySchema) as any,
    defaultValues: initialData || {
      employeeTypeId: '',
      dayOfWeek: 0,
      isHalfDay: false,
      isActive: true,
    },
  });

  const onSubmit = async (data: CreateWeeklyOffPolicyInput) => {
    try {
      setIsSaving(true);

      // Convert dayOfWeek to number since FormSelect returns string
      const payload = {
        ...data,
        dayOfWeek: Number(data.dayOfWeek),
      };

      if (initialData?.id) {
        await updateFn(initialData.id, payload);
        toast.success('Weekly Off Policy updated successfully');
      } else {
        await createFn(payload);
        toast.success('Weekly Off Policy created successfully');
      }
      onSuccess();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const daysOfWeek = [
    { label: 'Sunday', value: '0' },
    { label: 'Monday', value: '1' },
    { label: 'Tuesday', value: '2' },
    { label: 'Wednesday', value: '3' },
    { label: 'Thursday', value: '4' },
    { label: 'Friday', value: '5' },
    { label: 'Saturday', value: '6' },
  ];

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppField name="employeeTypeId" label="Employee Type">
            <FormSelect
              name="employeeTypeId"
              options={employeeTypes.map((et) => ({
                label: et.name,
                value: et.id,
              }))}
            />
          </AppField>

          <AppField name="dayOfWeek" label="Day of Week">
            <FormSelect name="dayOfWeek" options={daysOfWeek} />
          </AppField>
        </div>

        <div className="flex flex-col gap-4 pt-2">
          <AppField
            name="isHalfDay"
            label="Is Half Day"
            description="Is this weekly off only for half the day?"
          >
            <FormCheckbox name="isHalfDay" />
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
