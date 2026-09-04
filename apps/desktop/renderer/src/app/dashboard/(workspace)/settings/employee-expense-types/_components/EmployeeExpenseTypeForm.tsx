import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateEmployeeExpenseTypeInput,
  EmployeeExpenseTypeDto,
  LedgerDto,
  createEmployeeExpenseTypeSchema,
} from '@vyora/types';
import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { AppField } from '@/components/forms/AppField';
import { FormCheckbox } from '@/components/forms/FormCheckbox';
import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';

export type EmployeeExpenseTypeFormPayload = CreateEmployeeExpenseTypeInput;

interface EmployeeExpenseTypeFormProps {
  id: string;
  initialData?: EmployeeExpenseTypeDto | null;
  onSubmit: (data: EmployeeExpenseTypeFormPayload) => void;
  ledgers: LedgerDto[];
  isLoadingLedgers: boolean;
}

export function EmployeeExpenseTypeForm({
  id,
  initialData,
  onSubmit,
  ledgers,
  isLoadingLedgers,
}: EmployeeExpenseTypeFormProps) {
  const isSystem = initialData?.isSystem || false;

  const defaultValues: Partial<EmployeeExpenseTypeFormPayload> = {
    name: initialData?.name || '',
    ledgerId: initialData?.ledgerId || '',
    isActive: initialData?.isActive ?? true,
  };

  const form = useForm<EmployeeExpenseTypeFormPayload>({
    resolver: zodResolver(
      createEmployeeExpenseTypeSchema,
    ) as unknown as import('react-hook-form').Resolver<EmployeeExpenseTypeFormPayload>,
    defaultValues: defaultValues as EmployeeExpenseTypeFormPayload,
  });

  const ledgerOptions = ledgers.map((l) => ({
    label: l.name,
    value: l.id,
  }));

  return (
    <FormProvider {...form}>
      <form id={id} onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <AppField name="name" label="Name">
          <FormInput name="name" placeholder="e.g. Office Supplies" disabled={isSystem} />
        </AppField>

        <AppField name="ledgerId" label="Expense Ledger">
          <FormSelect
            name="ledgerId"
            options={ledgerOptions}
            disabled={isSystem || isLoadingLedgers}
          />
        </AppField>

        <AppField
          name="isActive"
          label="Active"
          description="Inactive expense types cannot be selected for new expenses"
        >
          <FormCheckbox name="isActive" disabled={isSystem} />
        </AppField>
      </form>
    </FormProvider>
  );
}
