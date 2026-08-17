import { TrialBalanceReport } from '@vyora/types';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useTrialBalance() {
  const [data, setData] = useState<TrialBalanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrialBalance = useCallback(async (asOfDate?: Date) => {
    setIsLoading(true);
    try {
      // The trialBalance service in IPC returns TrialBalanceReport directly without ApiResponse wrapper if it matches reportsHandlers logic,
      // wait, reportsHandlers.ts returns `trialBalanceService.getTrialBalance(...)` which returns `TrialBalanceReport`.
      // Let me double check if we need `.data` or if it's the raw object.
      // Usually IPC returns the object. Let's just type it as what getTrialBalance returns.
      const res = await window.vyora.reports.getTrialBalance(asOfDate);

      if (res) {
        setData(res);
      } else {
        toast.error('Failed to fetch Trial Balance');
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'An error occurred while fetching Trial Balance',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    fetchTrialBalance,
  };
}
