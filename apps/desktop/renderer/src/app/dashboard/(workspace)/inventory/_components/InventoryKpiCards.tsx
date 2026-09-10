'use client';

import { GlobalInventoryRowDto } from '@vyora/types';
import { formatMoney } from '@vyora/utils';
import * as React from 'react';

import { getInventoryHealthStatus, InventoryHealthStatus } from '../lib/inventory-health';

import { useCompanyContext } from '@/components/providers/CompanyContextProvider';
import { AppCard, AppCardContent, AppCardHeader, AppCardTitle } from '@/components/ui/AppCard';

export interface InventoryKpiCardsProps {
  data: GlobalInventoryRowDto[];
  onFilterStatus: (status: InventoryHealthStatus | 'ALL') => void;
}

export function InventoryKpiCards({ data, onFilterStatus }: InventoryKpiCardsProps) {
  const { context } = useCompanyContext();
  const totalProducts = data.length;
  const itemsInStock = data.filter(
    (row) => getInventoryHealthStatus(row.currentQty, row.reorderLevel) === 'IN_STOCK',
  ).length;
  const negativeStockItems = data.filter(
    (row) => getInventoryHealthStatus(row.currentQty, row.reorderLevel) === 'NEGATIVE',
  ).length;
  const lowStockItems = data.filter(
    (row) => getInventoryHealthStatus(row.currentQty, row.reorderLevel) === 'LOW',
  ).length;
  const totalInventoryValue = data.reduce((sum, row) => sum + row.currentValuePaise, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <AppCard>
        <AppCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <AppCardTitle className="text-sm font-medium">Total Products</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <div className="text-2xl font-bold">{totalProducts}</div>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <AppCardTitle className="text-sm font-medium">Items In Stock</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <div className="text-success text-2xl font-bold">{itemsInStock}</div>
        </AppCardContent>
      </AppCard>

      <AppCard
        className={
          lowStockItems > 0 ? 'hover:border-warning/50 cursor-pointer transition-colors' : ''
        }
        onClick={() => lowStockItems > 0 && onFilterStatus('LOW')}
      >
        <AppCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <AppCardTitle className="text-sm font-medium">Low Stock</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <div className="text-warning text-2xl font-bold">{lowStockItems}</div>
        </AppCardContent>
      </AppCard>

      <AppCard
        className={
          negativeStockItems > 0
            ? 'hover:border-destructive/50 cursor-pointer transition-colors'
            : ''
        }
        onClick={() => negativeStockItems > 0 && onFilterStatus('NEGATIVE')}
      >
        <AppCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <AppCardTitle className="text-sm font-medium">Negative Stock</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <div className="text-destructive text-2xl font-bold">{negativeStockItems}</div>
        </AppCardContent>
      </AppCard>

      <AppCard>
        <AppCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <AppCardTitle className="text-sm font-medium">Total Inventory Value</AppCardTitle>
        </AppCardHeader>
        <AppCardContent>
          <div className="text-2xl font-bold">
            {formatMoney(totalInventoryValue, context?.currency)}
          </div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}
