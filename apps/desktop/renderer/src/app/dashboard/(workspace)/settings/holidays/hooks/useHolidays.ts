import {
  CreateHolidayInput,
  HolidayDto,
  SearchHolidaysOptions,
  UpdateHolidayInput,
} from '@vyora/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useHolidays() {
  const [data, setData] = useState<HolidayDto[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHolidays = useCallback(async (options?: SearchHolidaysOptions) => {
    setIsLoading(true);
    try {
      const res = await window.vyora.db.holidays.search(options || { limit: 100, offset: 0 });
      if (res.success && res.data) {
        setData(res.data.data);
        setTotalRecords(res.data.total);
      } else {
        toast.error(res.error || 'Failed to fetch holidays');
      }
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred while fetching holidays');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createHoliday = async (input: CreateHolidayInput) => {
    const res = await window.vyora.db.holidays.create(input);
    if (!res.success) throw new Error(res.error || 'Failed to create holiday');
    return res.data;
  };

  const updateHoliday = async (id: string, input: UpdateHolidayInput) => {
    const res = await window.vyora.db.holidays.update(id, input);
    if (!res.success) throw new Error(res.error || 'Failed to update holiday');
    return res.data;
  };

  const deleteHoliday = async (id: string) => {
    const res = await window.vyora.db.holidays.delete(id);
    if (!res.success) throw new Error(res.error || 'Failed to delete holiday');
    return res.data;
  };

  return {
    data,
    totalRecords,
    isLoading,
    fetchHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday,
  };
}
