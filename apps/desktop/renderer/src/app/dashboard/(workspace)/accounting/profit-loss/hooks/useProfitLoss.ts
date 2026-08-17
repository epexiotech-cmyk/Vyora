import { ProfitLossReport } from '@vyora/types';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useProfitLoss() {
  const [data, setData] = useState<ProfitLossReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfitLoss = useCallback(async (asOfDate?: Date) => {
    setIsLoading(true);
    try {
      const res = await window.vyora.reports.getProfitLoss(asOfDate);
      if (res) {
        setData(res);
      } else {
        toast.error('Failed to fetch Profit & Loss report');
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'An error occurred while fetching Profit & Loss report',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    fetchProfitLoss,
  };
}
