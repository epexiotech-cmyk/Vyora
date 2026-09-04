import {
  CreateEmployeeExpenseTypeInput,
  EmployeeExpenseTypeDto,
  SearchEmployeeExpenseTypesOptions,
  UpdateEmployeeExpenseTypeInput,
} from '@vyora/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useEmployeeExpenseTypes() {
  const [data, setData] = useState<EmployeeExpenseTypeDto[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmployeeExpenseTypes = useCallback(
    async (options?: SearchEmployeeExpenseTypesOptions) => {
      setIsLoading(true);
      try {
        const res = await window.vyora.db.employeeExpenseTypes.search(
          options || { limit: 100, offset: 0 },
        );
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
    },
    [],
  );

  const createEmployeeExpenseType = async (input: CreateEmployeeExpenseTypeInput) => {
    const res = await window.vyora.db.employeeExpenseTypes.create(input);
    if (!res.success) throw new Error(res.error || 'Failed to create expense type');
    return res.data;
  };

  const updateEmployeeExpenseType = async (id: string, input: UpdateEmployeeExpenseTypeInput) => {
    const res = await window.vyora.db.employeeExpenseTypes.update(id, input);
    if (!res.success) throw new Error(res.error || 'Failed to update expense type');
    return res.data;
  };

  const deactivateEmployeeExpenseType = async (id: string) => {
    const res = await window.vyora.db.employeeExpenseTypes.delete(id);
    if (!res.success) throw new Error(res.error || 'Failed to deactivate expense type');
    return res.data;
  };

  return {
    data,
    totalRecords,
    isLoading,
    fetchEmployeeExpenseTypes,
    createEmployeeExpenseType,
    updateEmployeeExpenseType,
    deactivateEmployeeExpenseType,
  };
}
