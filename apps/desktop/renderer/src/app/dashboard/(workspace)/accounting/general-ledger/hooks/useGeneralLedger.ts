import { GeneralLedgerReport } from '@vyora/types';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export function useGeneralLedger() {
  const [data, setData] = useState<GeneralLedgerReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGeneralLedger = useCallback(async (startDate?: Date, endDate?: Date) => {
    setIsLoading(true);
    try {
      const res = await window.vyora.reports.getGeneralLedger({
        startDate,
        endDate,
      });

      if (res) {
        setData(res);
      } else {
        toast.error('Failed to fetch General Ledger');
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : 'An error occurred while fetching General Ledger',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data,
    isLoading,
    fetchGeneralLedger,
  };
}
