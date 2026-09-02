import {
  CreateExpensePresetInput,
  ExpensePresetDto,
  SearchExpensePresetsOptions,
  UpdateExpensePresetInput,
} from '@vyora/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useExpenseTypes() {
  const [data, setData] = useState<ExpensePresetDto[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchExpenseTypes = useCallback(async (options?: SearchExpensePresetsOptions) => {
    setIsLoading(true);
    try {
      const res = await window.vyora.db.expensePresets.search(options || { limit: 100, offset: 0 });
      if (res.success && res.data) {
        setData(res.data.data);
        setTotalRecords(res.data.total);
      } else {
        toast.error(res.error || 'Failed to fetch expense types');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred while fetching expense types');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createExpenseType = async (input: CreateExpensePresetInput) => {
    const res = await window.vyora.db.expensePresets.create(input);
    if (!res.success) throw new Error(res.error || 'Failed to create expense type');
    return res.data;
  };

  const updateExpenseType = async (input: UpdateExpensePresetInput) => {
    const res = await window.vyora.db.expensePresets.update(input);
    if (!res.success) throw new Error(res.error || 'Failed to update expense type');
    return res.data;
  };

  const deactivateExpenseType = async (id: string) => {
    const res = await window.vyora.db.expensePresets.delete(id);
    if (!res.success) throw new Error(res.error || 'Failed to deactivate expense type');
    return res.data;
  };

  return {
    data,
    totalRecords,
    isLoading,
    fetchExpenseTypes,
    createExpenseType,
    updateExpenseType,
    deactivateExpenseType,
  };
}
