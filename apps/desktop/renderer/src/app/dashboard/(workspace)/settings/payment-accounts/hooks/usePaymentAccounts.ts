import {
  PaymentAccountDto,
  PaymentAccountFilterDto,
  CreatePaymentAccountInput,
  UpdatePaymentAccountInput,
} from '@vyora/types';
import * as React from 'react';
import { toast } from 'sonner';

export function usePaymentAccounts() {
  const [data, setData] = React.useState<PaymentAccountDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [filters, setFilters] = React.useState<PaymentAccountFilterDto>({
    showSystemAccounts: true, // Defaulting to show all accounts initially, or as per spec
  });

  const fetchAccounts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await window.vyora.paymentAccounts.search(filters);
      setData(res);
    } catch {
      toast.error('Failed to fetch payment accounts');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await window.vyora.paymentAccounts.search(filters);
        if (!ignore) setData(res);
      } catch {
        if (!ignore) toast.error('Failed to fetch payment accounts');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [filters]);

  const updateFilters = React.useCallback((newFilters: Partial<PaymentAccountFilterDto>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const createAccount = React.useCallback(
    async (input: CreatePaymentAccountInput) => {
      const res = (await window.vyora.paymentAccounts.create(input)) as {
        success?: boolean;
        error?: string;
      };
      if (res && res.success === false) throw new Error(res.error || 'Failed to create account');
      await fetchAccounts();
      return res;
    },
    [fetchAccounts],
  );

  const updateAccount = React.useCallback(
    async (id: string, input: UpdatePaymentAccountInput) => {
      const res = (await window.vyora.paymentAccounts.update(id, input)) as {
        success?: boolean;
        error?: string;
      };
      if (res && res.success === false) throw new Error(res.error || 'Failed to update account');
      await fetchAccounts();
      return res;
    },
    [fetchAccounts],
  );

  const deleteAccount = React.useCallback(
    async (id: string) => {
      const res = (await window.vyora.paymentAccounts.delete(id)) as {
        success?: boolean;
        error?: string;
        code?: string;
        details?: Record<string, unknown>;
      };
      if (res && res.success === false) {
        if (res.code === 'ACCOUNT_HAS_HISTORY') {
          throw new Error(
            `Cannot delete: Account has ${res.details?.journalCount || 0} journals. Please deactivate it instead.`,
          );
        }
        throw new Error(res.error || 'Failed to delete account');
      }
      await fetchAccounts();
      return res;
    },
    [fetchAccounts],
  );

  const setDefaultAccount = React.useCallback(
    async (id: string) => {
      const res = (await window.vyora.paymentAccounts.update(id, { isDefault: true })) as {
        success?: boolean;
        error?: string;
      };
      if (res && res.success === false) throw new Error(res.error || 'Failed to set default');
      await fetchAccounts();
      return res;
    },
    [fetchAccounts],
  );

  const activateAccount = React.useCallback(
    async (id: string) => {
      const res = (await window.vyora.paymentAccounts.update(id, { isActive: true })) as {
        success?: boolean;
        error?: string;
      };
      if (res && res.success === false) throw new Error(res.error || 'Failed to activate account');
      await fetchAccounts();
      return res;
    },
    [fetchAccounts],
  );

  const deactivateAccount = React.useCallback(
    async (id: string) => {
      const res = (await window.vyora.paymentAccounts.update(id, { isActive: false })) as {
        success?: boolean;
        error?: string;
      };
      if (res && res.success === false)
        throw new Error(res.error || 'Failed to deactivate account');
      await fetchAccounts();
      return res;
    },
    [fetchAccounts],
  );

  const fetchOpeningBalance = React.useCallback(async (paymentAccountId: string) => {
    try {
      const res = await window.vyora.paymentAccounts.openingBalance.get(paymentAccountId);
      return res.data;
    } catch {
      return null; // Might be locked or no balance
    }
  }, []);

  const savePaymentAccountWithOpeningBalance = React.useCallback(
    async (payload: {
      isEditing: boolean;
      accountId?: string;
      accountData: CreatePaymentAccountInput | UpdatePaymentAccountInput;
      openingBalance?: {
        amount: number;
        type: 'Dr' | 'Cr';
        date: Date;
        notes?: string;
      };
    }) => {
      const res = await window.vyora.paymentAccounts.saveWithOpeningBalance(payload);
      if (!res.success) {
        throw new Error(
          typeof res.error === 'string' ? res.error : 'Failed to save payment account',
        );
      }
      await fetchAccounts();
    },
    [fetchAccounts],
  );

  return {
    data,
    isLoading,
    filters,
    updateFilters,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    setDefaultAccount,
    activateAccount,
    deactivateAccount,
    fetchOpeningBalance,
    savePaymentAccountWithOpeningBalance,
  };
}
