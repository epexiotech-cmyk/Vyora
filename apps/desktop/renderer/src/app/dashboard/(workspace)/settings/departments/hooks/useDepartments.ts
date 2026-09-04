import {
  CreateDepartmentInput,
  DepartmentDto,
  SearchDepartmentsOptions,
  UpdateDepartmentInput,
} from '@vyora/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useDepartments() {
  const [data, setData] = useState<DepartmentDto[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDepartments = useCallback(async (options?: SearchDepartmentsOptions) => {
    setIsLoading(true);
    try {
      const res = await window.vyora.db.departments.search(options || { limit: 100, offset: 0 });
      if (res.success && res.data) {
        setData(res.data.data);
        setTotalRecords(res.data.total);
      } else {
        toast.error(res.error || 'Failed to fetch departments');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred while fetching departments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDepartment = async (input: CreateDepartmentInput) => {
    const res = await window.vyora.db.departments.create(input);
    if (!res.success) throw new Error(res.error || 'Failed to create department');
    return res.data;
  };

  const updateDepartment = async (id: string, input: UpdateDepartmentInput) => {
    const res = await window.vyora.db.departments.update(id, input);
    if (!res.success) throw new Error(res.error || 'Failed to update department');
    return res.data;
  };

  const deleteDepartment = async (id: string) => {
    const res = await window.vyora.db.departments.delete(id);
    if (!res.success) throw new Error(res.error || 'Failed to delete department');
    return res.data;
  };

  return {
    data,
    totalRecords,
    isLoading,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
