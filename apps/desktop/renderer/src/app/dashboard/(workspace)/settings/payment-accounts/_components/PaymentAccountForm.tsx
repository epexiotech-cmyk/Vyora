import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreatePaymentAccountInput,
  createPaymentAccountSchema,
  PaymentAccountDto,
  PaymentAccountTypeEnum,
  updatePaymentAccountSchema,
  UpdatePaymentAccountInput,
} from '@vyora/types';
import * as React from 'react';
import { useForm, FormProvider, useWatch, Resolver } from 'react-hook-form';
import { z } from 'zod';

import { AppField } from '@/components/forms/AppField';
import { FormInput } from '@/components/forms/FormInput';
import { FormSelect } from '@/components/forms/FormSelect';

import { BalanceImpactMessage } from '../../../accounting/_components/BalanceImpactMessage';

export type PaymentAccountFormPayload = (CreatePaymentAccountInput | UpdatePaymentAccountInput) & {
  openingBalanceAmount?: number;
  openingBalanceType?: 'Dr' | 'Cr';
  openingBalanceDate?: string;
};

const obSchema = z.object({
  openingBalanceAmount: z.coerce.number().min(0).optional(),
  openingBalanceType: z.enum(['Dr', 'Cr']).optional(),
  openingBalanceDate: z.string().optional(),
});

const extendedCreateSchema = createPaymentAccountSchema.and(obSchema);
const extendedUpdateSchema = updatePaymentAccountSchema.and(obSchema);

interface PaymentAccountFormProps {
  initialData?: PaymentAccountDto | null;
  initialOpeningBalance?: { amount: number; type: 'Dr' | 'Cr'; date: Date } | null;
  onSubmitAction: (data: PaymentAccountFormPayload) => Promise<void>;
  isSaving: boolean;
  formId: string;
}

export function PaymentAccountForm({
  initialData,
  initialOpeningBalance,
  onSubmitAction,
  formId,
}: PaymentAccountFormProps) {
  const isEditing = !!initialData?.id;

  const methods = useForm<PaymentAccountFormPayload>({
    resolver: zodResolver(
      isEditing ? extendedUpdateSchema : extendedCreateSchema,
    ) as unknown as Resolver<PaymentAccountFormPayload>,
    defaultValues: {
      ...(initialData || {
        accountType: 'BANK',
        displayName: '',
        isActive: true,
        bankName: '',
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        upiId: '',
        merchantName: '',
        notes: '',
      }),
      openingBalanceAmount: initialOpeningBalance?.amount || 0,
      openingBalanceType: initialOpeningBalance?.type || 'Dr',
      openingBalanceDate: initialOpeningBalance?.date
        ? initialOpeningBalance.date.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    },
  });

  const accountType = useWatch({ control: methods.control, name: 'accountType' });
  const openingBalanceAmount = useWatch({ control: methods.control, name: 'openingBalanceAmount' });
  const openingBalanceType = useWatch({ control: methods.control, name: 'openingBalanceType' });
  const showOpeningBalance = ['BANK', 'CASH', 'UPI', 'POS'].includes(accountType || '');

  const handleFormSubmit = (data: PaymentAccountFormPayload) => {
    if (data.ifscCode) {
      data.ifscCode = data.ifscCode.toUpperCase();
    }
    return onSubmitAction(data);
  };

  return (
    <FormProvider {...methods}>
      <form id={formId} onSubmit={methods.handleSubmit(handleFormSubmit)} className="space-y-4">
        <AppField label="Account Type" name="accountType">
          <FormSelect
            name="accountType"
            disabled={isEditing}
            options={PaymentAccountTypeEnum.map((type) => ({ label: type, value: type }))}
          />
        </AppField>

        <AppField label="Display Name" name="displayName">
          <FormInput name="displayName" placeholder="e.g. HDFC Main Account" />
        </AppField>

        {accountType === 'BANK' && (
          <>
            <AppField label="Bank Name" name="bankName">
              <FormInput name="bankName" placeholder="HDFC Bank" />
            </AppField>
            <AppField label="Account Holder Name" name="accountHolderName">
              <FormInput name="accountHolderName" placeholder="Vyora Tech" />
            </AppField>
            <AppField label="Account Number" name="accountNumber">
              <FormInput name="accountNumber" placeholder="XXXXXXX" />
            </AppField>
            <AppField label="IFSC Code" name="ifscCode">
              <FormInput name="ifscCode" placeholder="HDFC0001234" className="uppercase" />
            </AppField>
            <AppField label="Branch Name" name="branchName">
              <FormInput name="branchName" placeholder="Main Branch" />
            </AppField>
          </>
        )}

        {accountType === 'UPI' && (
          <>
            <AppField label="UPI ID" name="upiId">
              <FormInput name="upiId" placeholder="business@upi" />
            </AppField>
            <AppField label="Merchant Name" name="merchantName">
              <FormInput name="merchantName" placeholder="Vyora" />
            </AppField>
          </>
        )}

        {showOpeningBalance && (
          <div className="mt-4 space-y-4 border-t pt-4">
            <h4 className="text-foreground text-sm font-medium">Opening Balance</h4>
            <div className="grid grid-cols-2 gap-4">
              <AppField label="Amount" name="openingBalanceAmount">
                <FormInput
                  name="openingBalanceAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </AppField>

              <AppField label="Balance Type" name="openingBalanceType">
                <FormSelect
                  name="openingBalanceType"
                  options={[
                    { label: 'Debit', value: 'Dr' },
                    { label: 'Credit', value: 'Cr' },
                  ]}
                />
              </AppField>
            </div>

            <AppField label="Date" name="openingBalanceDate">
              <FormInput name="openingBalanceDate" type="date" />
            </AppField>

            <BalanceImpactMessage
              amount={Number(openingBalanceAmount) || 0}
              balanceType={openingBalanceType as 'Dr' | 'Cr' | undefined}
            />
          </div>
        )}

        <AppField label="Notes" name="notes">
          <FormInput name="notes" placeholder="Optional notes..." />
        </AppField>

        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            className="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
            {...methods.register('isActive')}
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Active
          </label>
        </div>
      </form>
    </FormProvider>
  );
}
