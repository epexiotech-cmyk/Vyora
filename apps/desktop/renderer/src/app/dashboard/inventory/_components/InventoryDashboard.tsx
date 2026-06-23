'use client';

import { GlobalInventoryRowDto } from '@vyora/types';
import { AlertCircle } from 'lucide-react';
import * as React from 'react';

import { GlobalInventoryGrid } from './GlobalInventoryGrid';
import { InventoryKpiCards } from './InventoryKpiCards';

import { SectionHeader } from '@/components/ui/SectionHeader';

export function InventoryDashboard() {
  const [data, setData] = React.useState<GlobalInventoryRowDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [showNegativeOnly, setShowNegativeOnly] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        // We use the getAll endpoint which includes everything, then filter on the client.
        // The API returns ApiResponse<GlobalInventoryRowDto[]>
        const response = await window.vyora.inventory.getGlobalInventory();

        if (mounted) {
          if (response.success && response.data) {
            setData(response.data);
          } else {
            setError(response.error || 'Failed to load inventory data');
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          setError((err as Error).message || 'An unexpected error occurred');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Global Inventory"
        description="View real-time stock balances and valuation across the active financial year."
      />

      {error ? (
        <div className="bg-destructive/15 text-destructive flex items-center gap-2 rounded-md p-4">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      ) : (
        <>
          <InventoryKpiCards data={data} />

          <div className="mt-4">
            <GlobalInventoryGrid
              data={data}
              isLoading={isLoading}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              showNegativeOnly={showNegativeOnly}
              onToggleNegativeOnly={() => setShowNegativeOnly((prev) => !prev)}
            />
          </div>
        </>
      )}
    </div>
  );
}
