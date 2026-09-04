import {
  CreateEmployeeTypeInput,
  EmployeeTypeDto,
  SearchEmployeeTypesOptions,
  UpdateEmployeeTypeInput,
} from '@vyora/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useEmployeeTypes() {
  const [data, setData] = useState<EmployeeTypeDto[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmployeeTypes = useCallback(async (options?: SearchEmployeeTypesOptions) => {
    setIsLoading(true);
    try {
      const res = await window.vyora.db.employeeTypes.search(options || { limit: 100, offset: 0 });
      if (res.success && res.data) {
        setData(res.data.data);
        setTotalRecords(res.data.total);
      } else {
        toast.error(res.error || 'Failed to fetch employee types');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred while fetching employee types');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEmployeeType = async (input: CreateEmployeeTypeInput) => {
    const res = await window.vyora.db.employeeTypes.create(input);
    if (!res.success) throw new Error(res.error || 'Failed to create employee type');
    return res.data;
  };

  const updateEmployeeType = async (id: string, input: UpdateEmployeeTypeInput) => {
    const res = await window.vyora.db.employeeTypes.update(id, input);
    if (!res.success) throw new Error(res.error || 'Failed to update employee type');
    return res.data;
  };

  const deleteEmployeeType = async (id: string) => {
    const res = await window.vyora.db.employeeTypes.delete(id);
    if (!res.success) throw new Error(res.error || 'Failed to delete employee type');
    return res.data;
  };

  return {
    data,
    totalRecords,
    isLoading,
    fetchEmployeeTypes,
    createEmployeeType,
    updateEmployeeType,
    deleteEmployeeType,
  };
}
