import { zodResolver } from '@hookform/resolvers/zod';
import {
  createFundTransferSchema,
  CreateFundTransferInput,
  FundTransferDto,
  TransferTypeEnum,
  TransferType,
  PaymentAccountDto,
} from '@vyora/types';
import React, { useEffect, useMemo } from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm, Controller, useWatch } from 'react-hook-form';

import { usePaymentAccounts } from '../../../settings/payment-accounts/hooks/usePaymentAccounts';

import { AppSelect } from '@/components/shared/form/AppSelect';
import { AppInput } from '@/components/ui/AppInput';
import { Button } from '@/components/ui/button';

interface FundTransferFormProps {
  initialData?: FundTransferDto;
  onSubmit: (data: CreateFundTransferInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const TRANSFER_TYPES: { label: string; value: TransferType }[] = TransferTypeEnum.map((val) => {
  const label = val
    .split('_TO_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' → ');
  return { label, value: val };
});

function formatAccountLabel(acc: PaymentAccountDto) {
  let suffix = '';
  if (acc.accountType === 'BANK' && acc.accountNumber) {
    suffix = ` ••••${acc.accountNumber.slice(-4)}`;
  } else if (acc.isDefault) {
    suffix = ' (Default)';
  }
  return `${acc.displayName}${suffix}`;
}

const GROUP_LABELS: Record<string, string> = {
  BANK: 'Bank Accounts',
  CASH: 'Cash Accounts',
  UPI: 'UPI Accounts',
  POS: 'POS Accounts',
};

export function FundTransferForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: FundTransferFormProps) {
  const { data: accountsData, isLoading: isLoadingAccounts } = usePaymentAccounts();
  const accounts = useMemo(() => accountsData || [], [accountsData]);

  const form = useForm<CreateFundTransferInput>({
    resolver: zodResolver(createFundTransferSchema) as unknown as Resolver<CreateFundTransferInput>,
    defaultValues: {
      transferType: initialData?.transferType || 'BANK_TO_BANK',
      sourceAccountId: initialData?.sourceAccountId || '',
      destinationAccountId: initialData?.destinationAccountId || '',
      amount: initialData?.amount || 0,
      transferDate: initialData?.transferDate ? new Date(initialData.transferDate) : new Date(),
      referenceNumber: initialData?.referenceNumber || '',
      remarks: initialData?.remarks || '',
    },
  });

  const transferType = useWatch({ control: form.control, name: 'transferType' });
  const sourceAccountId = useWatch({ control: form.control, name: 'sourceAccountId' });

  // When transferType changes, reset the source and destination if they are no longer valid
  useEffect(() => {
    const currentSource = accounts.find((a) => a.id === form.getValues('sourceAccountId'));
    const currentDest = accounts.find((a) => a.id === form.getValues('destinationAccountId'));
    const [expectedSourceType, expectedDestType] = transferType.split('_TO_');

    if (currentSource && currentSource.accountType !== expectedSourceType) {
      form.setValue('sourceAccountId', '');
    }
    if (currentDest && currentDest.accountType !== expectedDestType) {
      form.setValue('destinationAccountId', '');
    }
  }, [transferType, accounts, form]);

  const handleSubmit = async (data: unknown) => {
    await onSubmit(data as CreateFundTransferInput);
  };

  const [expectedSourceType, expectedDestType] = transferType.split('_TO_');

  const sourceOptions = useMemo(() => {
    return accounts
      .filter((a) => a.accountType === expectedSourceType)
      .map((acc) => ({
        label: formatAccountLabel(acc),
        value: acc.id,
        group: GROUP_LABELS[acc.accountType] || 'Other Accounts',
      }));
  }, [accounts, expectedSourceType]);

  const destOptions = useMemo(() => {
    return accounts
      .filter((a) => a.accountType === expectedDestType && a.id !== sourceAccountId)
      .map((acc) => ({
        label: formatAccountLabel(acc),
        value: acc.id,
        group: GROUP_LABELS[acc.accountType] || 'Other Accounts',
      }));
  }, [accounts, expectedDestType, sourceAccountId]);

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Transfer Type</label>
        <Controller
          control={form.control}
          name="transferType"
          render={({ field }) => (
            <AppSelect value={field.value} onChange={field.onChange} options={TRANSFER_TYPES} />
          )}
        />
        {form.formState.errors.transferType && (
          <p className="text-destructive text-sm">{form.formState.errors.transferType.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Source Account</label>
          <Controller
            control={form.control}
            name="sourceAccountId"
            render={({ field }) => (
              <AppSelect
                value={field.value || ''}
                onChange={field.onChange}
                disabled={isLoadingAccounts}
                placeholder="Select Source Account"
                options={sourceOptions}
              />
            )}
          />
          {form.formState.errors.sourceAccountId && (
            <p className="text-destructive text-sm">
              {form.formState.errors.sourceAccountId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Destination Account</label>
          <Controller
            control={form.control}
            name="destinationAccountId"
            render={({ field }) => (
              <AppSelect
                value={field.value || ''}
                onChange={field.onChange}
                disabled={isLoadingAccounts || !sourceAccountId}
                placeholder="Select Destination Account"
                options={destOptions}
              />
            )}
          />
          {form.formState.errors.destinationAccountId && (
            <p className="text-destructive text-sm">
              {form.formState.errors.destinationAccountId.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <AppInput
            type="number"
            step="0.01"
            {...form.register('amount', { valueAsNumber: true })}
          />
          {form.formState.errors.amount && (
            <p className="text-destructive text-sm">{form.formState.errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Transfer Date</label>
          <AppInput
            type="date"
            {...form.register('transferDate')}
            defaultValue={
              form.getValues('transferDate')
                ? new Date(form.getValues('transferDate')).toISOString().split('T')[0]
                : ''
            }
          />
          {form.formState.errors.transferDate && (
            <p className="text-destructive text-sm">{form.formState.errors.transferDate.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Reference Number</label>
        <AppInput {...form.register('referenceNumber')} placeholder="UTR / Check No" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Remarks</label>
        <AppInput {...form.register('remarks')} placeholder="Optional remarks" />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update Transfer' : 'Create Transfer'}
        </Button>
      </div>
    </form>
  );
}
