import type {
  CreateFundTransferInput,
  UpdateFundTransferInput,
  FundTransferQueryFilter,
  FundTransferListDto,
} from '@vyora/types';
import { useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useFundTransfers(filter: FundTransferQueryFilter) {
  const [data, setData] = useState<FundTransferListDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReversing, setIsReversing] = useState(false);

  const filterString = JSON.stringify(filter);

  const fetchTransfers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filterObj = JSON.parse(filterString);
      const response = await window.vyora.fundTransfers.getAll(filterObj);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch fund transfers');
      }
      setData(response.data || null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err);
        toast.error(err.message || 'Failed to fetch fund transfers');
      } else {
        toast.error('Failed to fetch fund transfers');
      }
    } finally {
      setIsLoading(false);
    }
  }, [filterString]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransfers();
  }, [fetchTransfers]);

  const createTransfer = async (input: CreateFundTransferInput) => {
    setIsCreating(true);
    try {
      const response = await window.vyora.fundTransfers.create(input);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create fund transfer');
      }
      toast.success('Fund transfer created successfully');
      fetchTransfers();
      return response.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create fund transfer';
      toast.error(message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const updateTransfer = async ({ id, input }: { id: string; input: UpdateFundTransferInput }) => {
    setIsUpdating(true);
    try {
      const response = await window.vyora.fundTransfers.update(id, input);
      if (!response.success) {
        throw new Error(response.error || 'Failed to update fund transfer');
      }
      toast.success('Fund transfer updated successfully');
      fetchTransfers();
      return response.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update fund transfer';
      toast.error(message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const reverseTransfer = async (id: string) => {
    setIsReversing(true);
    try {
      const response = await window.vyora.fundTransfers.reverse(id);
      if (!response.success) {
        throw new Error(response.error || 'Failed to reverse fund transfer');
      }
      toast.success('Fund transfer reversed successfully');
      fetchTransfers();
      return response.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reverse fund transfer';
      toast.error(message);
      throw err;
    } finally {
      setIsReversing(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    invalidate: fetchTransfers,
    createTransfer,
    updateTransfer,
    reverseTransfer,
    isCreating,
    isUpdating,
    isReversing,
  };
}
