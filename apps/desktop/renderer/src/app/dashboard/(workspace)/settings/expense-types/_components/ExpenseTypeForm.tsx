import {
  CreateExpensePresetInput,
  ExpensePresetDto,
  LedgerDto,
  createExpensePresetSchema,
} from '@vyora/types';
import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { AppField } from '@/components/forms/AppField';
import { FormCheckbox } from '@/components/forms/FormCheckbox';
import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';

export type ExpenseTypeFormPayload = CreateExpensePresetInput;

interface ExpenseTypeFormProps {
  id: string;
  initialData?: ExpensePresetDto | null;
  onSubmit: (data: ExpenseTypeFormPayload) => void;
  ledgers: LedgerDto[];
  isLoadingLedgers: boolean;
}

export function ExpenseTypeForm({
  id,
  initialData,
  onSubmit,
  ledgers,
  isLoadingLedgers,
}: ExpenseTypeFormProps) {
  const isSystem = initialData?.isSystem || false;

  const defaultValues: Partial<ExpenseTypeFormPayload> = {
    name: initialData?.name || '',
    ledgerId: initialData?.ledgerId || '',
    isActive: initialData?.isActive ?? true,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    resolver: zodResolver(createExpensePresetSchema),
    defaultValues,
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
