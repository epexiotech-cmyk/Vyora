'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  createLeaveRequestInputSchema,
  CreateLeaveRequestInput,
  LeaveTypeDto,
  FinancialYearDto,
} from '@vyora/types';
import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';
import { AppModal } from '@/components/shared';
import { AppButton } from '@/components/ui/AppButton';

interface LeaveRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLeaveRequestInput) => Promise<void>;
  employeeId: string;
  leaveTypes: LeaveTypeDto[];
  financialYears: FinancialYearDto[];
}

export function LeaveRequestForm({
  isOpen,
  onClose,
  onSubmit,
  employeeId,
  leaveTypes,
  financialYears,
}: LeaveRequestFormProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const methods = useForm<any>({
    resolver: zodResolver(createLeaveRequestInputSchema),
    defaultValues: {
      employeeId,
      leaveTypeId: '',
      financialYearId: '',
      fromDate: 0,
      toDate: 0,
      requestedDays: 1,
      reason: '',
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (data: any) => {
    // Ensure fromDate and toDate are converted to timestamps if they are date strings.
    const payload: CreateLeaveRequestInput = {
      ...data,
      fromDate: new Date(data.fromDate).getTime(),
      toDate: new Date(data.toDate).getTime(),
    };
    await onSubmit(payload);
  };

  React.useEffect(() => {
    if (isOpen) {
      methods.reset({
        employeeId,
        leaveTypeId: '',
        financialYearId: '',
        fromDate: new Date().toISOString().split('T')[0], // For date input compatibility
        toDate: new Date().toISOString().split('T')[0],
        requestedDays: 1,
        reason: '',
      });
    }
  }, [isOpen, employeeId, methods]);

  return (
    <AppModal isOpen={isOpen} onClose={onClose} title="Request Leave">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
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
            <AppField name="fromDate" label="From Date">
              <FormInput name="fromDate" type="date" />
            </AppField>
            <AppField name="toDate" label="To Date">
              <FormInput name="toDate" type="date" />
            </AppField>
          </div>
          <AppField name="requestedDays" label="Requested Days">
            <FormInput name="requestedDays" type="number" step="0.5" min="0.5" />
          </AppField>
          <AppField name="reason" label="Reason">
            <FormInput name="reason" placeholder="Reason for leave" />
          </AppField>

          <div className="flex justify-end gap-2 pt-4">
            <AppButton
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={methods.formState.isSubmitting}
            >
              Cancel
            </AppButton>
            <AppButton type="submit" disabled={methods.formState.isSubmitting}>
              {methods.formState.isSubmitting ? 'Submitting...' : 'Submit Request'}
            </AppButton>
          </div>
        </form>
      </FormProvider>
    </AppModal>
  );
}
