import {
  CreateDesignationInput,
  DesignationDto,
  SearchDesignationsOptions,
  UpdateDesignationInput,
} from '@vyora/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useDesignations() {
  const [data, setData] = useState<DesignationDto[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDesignations = useCallback(async (options?: SearchDesignationsOptions) => {
    setIsLoading(true);
    try {
      const res = await window.vyora.db.designations.search(options || { limit: 100, offset: 0 });
      if (res.success && res.data) {
        setData(res.data.data);
        setTotalRecords(res.data.total);
      } else {
        toast.error(res.error || 'Failed to fetch designations');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred while fetching designations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createDesignation = async (input: CreateDesignationInput) => {
    const res = await window.vyora.db.designations.create(input);
    if (!res.success) throw new Error(res.error || 'Failed to create designation');
    return res.data;
  };

  const updateDesignation = async (id: string, input: UpdateDesignationInput) => {
    const res = await window.vyora.db.designations.update(id, input);
    if (!res.success) throw new Error(res.error || 'Failed to update designation');
    return res.data;
  };

  const deleteDesignation = async (id: string) => {
    const res = await window.vyora.db.designations.delete(id);
    if (!res.success) throw new Error(res.error || 'Failed to delete designation');
    return res.data;
  };

  return {
    data,
    totalRecords,
    isLoading,
    fetchDesignations,
    createDesignation,
    updateDesignation,
    deleteDesignation,
  };
}
