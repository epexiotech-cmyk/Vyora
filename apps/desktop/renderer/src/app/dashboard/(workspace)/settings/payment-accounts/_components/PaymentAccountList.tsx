'use client';

import { PaymentAccountDto } from '@vyora/types';
import { moneyToPaise } from '@vyora/utils';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { usePaymentAccounts } from '../hooks/usePaymentAccounts';

import { PaymentAccountDialog } from './PaymentAccountDialog';
import { PaymentAccountFilters } from './PaymentAccountFilters';
import { PaymentAccountTable } from './PaymentAccountTable';

import { AppButton } from '@/components/ui/AppButton';

export function PaymentAccountList() {
  const {
    data,
    isLoading,
    filters,
    updateFilters,
    deleteAccount,
    setDefaultAccount,
    activateAccount,
    deactivateAccount,
    fetchOpeningBalance,
    savePaymentAccountWithOpeningBalance,
  } = usePaymentAccounts();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] = React.useState<PaymentAccountDto | null>(null);

  const handleCreateOrEdit = (account?: PaymentAccountDto) => {
    setEditingAccount(account || null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (
    formData: import('./PaymentAccountForm').PaymentAccountFormPayload,
  ) => {
    try {
      const { openingBalanceAmount, openingBalanceType, openingBalanceDate, ...accountData } =
        formData;

      const obData =
        openingBalanceAmount !== undefined && openingBalanceAmount !== null
          ? {
              amount: moneyToPaise(openingBalanceAmount),
              type: openingBalanceType || 'Dr',
              date: openingBalanceDate ? new Date(openingBalanceDate) : new Date(),
              notes: formData.notes || undefined,
            }
          : undefined;

      await savePaymentAccountWithOpeningBalance({
        isEditing: !!editingAccount,
        accountId: editingAccount?.id,
        accountData,
        openingBalance: obData,
      });

      toast.success(
        editingAccount
          ? 'Payment account updated successfully'
          : 'Payment account created successfully',
      );
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to save payment account');
      throw error;
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAccount(id);
      toast.success('Default account updated');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to set default account');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateAccount(id);
      toast.success('Account activated');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to activate account');
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateAccount(id);
      toast.success('Account deactivated');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to deactivate account');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAccount(id);
      toast.success('Payment account deleted');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to delete payment account');
      throw error;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-2xl font-semibold tracking-tight">Payment Accounts</h3>
          <p className="text-muted-foreground text-sm">
            Manage your payment accounts, banks, and UPI configurations.
          </p>
        </div>
        <AppButton onClick={() => handleCreateOrEdit()} className="rounded-full shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          New Payment Account
        </AppButton>
      </div>

      <div
        className="bg-card border-border/40 flex flex-col overflow-hidden border"
        style={{ borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}
      >
        <div className="border-border/40 block w-full border-b p-5">
          <PaymentAccountFilters filters={filters} onFilterChange={updateFilters} />
        </div>
        <div>
          <PaymentAccountTable
            data={data}
            isLoading={isLoading}
            onEdit={handleCreateOrEdit}
            onSetDefault={handleSetDefault}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <PaymentAccountDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingAccount}
        onSubmit={handleFormSubmit}
        fetchOpeningBalance={fetchOpeningBalance}
      />
    </div>
  );
}
