import {
  CreateWorkLocationInput,
  WorkLocationDto,
  SearchWorkLocationsOptions,
  UpdateWorkLocationInput,
} from '@vyora/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useWorkLocations() {
  const [data, setData] = useState<WorkLocationDto[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkLocations = useCallback(async (options?: SearchWorkLocationsOptions) => {
    setIsLoading(true);
    try {
      const res = await window.vyora.db.workLocations.search(options || { limit: 100, offset: 0 });
      if (res.success && res.data) {
        setData(res.data.data);
        setTotalRecords(res.data.total);
      } else {
        toast.error(res.error || 'Failed to fetch work locations');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred while fetching work locations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createWorkLocation = async (input: CreateWorkLocationInput) => {
    const res = await window.vyora.db.workLocations.create(input);
    if (!res.success) throw new Error(res.error || 'Failed to create work location');
    return res.data;
  };

  const updateWorkLocation = async (id: string, input: UpdateWorkLocationInput) => {
    const res = await window.vyora.db.workLocations.update(id, input);
    if (!res.success) throw new Error(res.error || 'Failed to update work location');
    return res.data;
  };

  const deleteWorkLocation = async (id: string) => {
    const res = await window.vyora.db.workLocations.delete(id);
    if (!res.success) throw new Error(res.error || 'Failed to delete work location');
    return res.data;
  };

  return {
    data,
    totalRecords,
    isLoading,
    fetchWorkLocations,
    createWorkLocation,
    updateWorkLocation,
    deleteWorkLocation,
  };
}
