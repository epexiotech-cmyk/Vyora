import {
  CreateSalaryComponentInput,
  SalaryComponentDto,
  SearchSalaryComponentsOptions,
  UpdateSalaryComponentInput,
} from '@vyora/types';
import * as React from 'react';

export function useSalaryComponents() {
  const [data, setData] = React.useState<SalaryComponentDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [total, setTotal] = React.useState(0);

  const fetchSalaryComponents = React.useCallback(
    async (options?: SearchSalaryComponentsOptions) => {
      setIsLoading(true);
      try {
        const res = await window.vyora.db.salaryComponents.search({
          page: options?.page || 1,
          pageSize: options?.pageSize || 100,
          query: options?.query,
          category: options?.category,
          isActive: options?.isActive,
        });
        if (res.success && res.data) {
          setData(res.data.items);
          setTotal(res.data.total);
        } else {
          throw new Error(res.error || 'Failed to fetch salary components');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const createSalaryComponent = async (input: CreateSalaryComponentInput) => {
    const res = await window.vyora.db.salaryComponents.create(input);
    if (!res.success) throw new Error(res.error);
    return res.data;
  };

  const updateSalaryComponent = async (id: string, input: UpdateSalaryComponentInput) => {
    const res = await window.vyora.db.salaryComponents.update(id, input);
    if (!res.success) throw new Error(res.error);
    return res.data;
  };

  const deactivateSalaryComponent = async (id: string) => {
    const res = await window.vyora.db.salaryComponents.deactivate(id);
    if (!res.success) throw new Error(res.error);
  };

  return {
    data,
    total,
    isLoading,
    fetchSalaryComponents,
    createSalaryComponent,
    updateSalaryComponent,
    deactivateSalaryComponent,
  };
}
