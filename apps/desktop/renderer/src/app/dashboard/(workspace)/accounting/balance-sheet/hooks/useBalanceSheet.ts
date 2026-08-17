import { BalanceSheetReport } from '@vyora/types';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useBalanceSheet() {
  const [data, setData] = useState<BalanceSheetReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalanceSheet = useCallback(async (asOfDate?: Date) => {
    setIsLoading(true);
    try {
      const res = await window.vyora.reports.getBalanceSheet(asOfDate);
      if (res) {
        setData(res);
      } else {
        toast.error('Failed to fetch Balance Sheet report');
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'An error occurred while fetching Balance Sheet report',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    fetchBalanceSheet,
  };
}
