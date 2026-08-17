import {
  LedgerDto,
  SearchLedgersOptions,
  CreateLedgerInput,
  UpdateLedgerInput,
} from '@vyora/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useLedgers() {
  const [data, setData] = useState<LedgerDto[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLedgers = useCallback(async (options: SearchLedgersOptions) => {
    setIsLoading(true);
    try {
      const res = await window.vyora.accounting.ledgers.search(options);
      if (res.success && res.data) {
        setData(res.data.data);
        setTotalRecords(res.data.total);
      } else {
        toast.error(res.error || 'Failed to fetch ledgers');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLedger = async (input: CreateLedgerInput) => {
    const res = await window.vyora.accounting.ledgers.create(input);
    if (!res.success) throw new Error(res.error || 'Failed to create ledger');
    return res.data;
  };

  const updateLedger = async (id: string, input: UpdateLedgerInput) => {
    const res = await window.vyora.accounting.ledgers.update(id, input);
    if (!res.success) throw new Error(res.error || 'Failed to update ledger');
    return res.data;
  };

  const deactivateLedger = async (id: string) => {
    const res = await window.vyora.accounting.ledgers.delete(id);
    if (!res.success) throw new Error(res.error || 'Failed to deactivate ledger');
    return res.data;
  };

  return {
    data,
    totalRecords,
    isLoading,
    fetchLedgers,
    createLedger,
    updateLedger,
    deactivateLedger,
  };
}
