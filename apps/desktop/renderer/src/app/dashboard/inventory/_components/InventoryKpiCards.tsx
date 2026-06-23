'use client';

import { GlobalInventoryRowDto } from '@vyora/types';
import { formatCurrency } from '@vyora/utils';
import * as React from 'react';

import { AppCard, AppCardContent, AppCardHeader, AppCardTitle } from '@/components/ui/AppCard';

export interface InventoryKpiCardsProps {
  data: GlobalInventoryRowDto[];
}

export function InventoryKpiCards({ data }: InventoryKpiCardsProps) {
  const totalProducts = data.length;
  const itemsInStock = data.filter((row) => row.currentQty > 0).length;
  const negativeStockItems = data.filter((row) => row.currentQty < 0).length;
  const totalInventoryValue = data.reduce((sum, row) => sum + row.currentValuePaise, 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      <AppCard>
        <AppCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <AppCardTitle className="text-sm font-medium">Negative Stock Items</AppCardTitle>
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
          <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
        </AppCardContent>
      </AppCard>
    </div>
  );
}
