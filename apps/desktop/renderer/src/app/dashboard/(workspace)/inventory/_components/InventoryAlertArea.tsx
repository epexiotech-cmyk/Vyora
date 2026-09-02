import { GlobalInventoryRowDto } from '@vyora/types';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import * as React from 'react';

import { getInventoryHealthStatus } from '../lib/inventory-health';

export interface InventoryAlertAreaProps {
  data: GlobalInventoryRowDto[];
  onFilterStatus: (status: 'NEGATIVE' | 'LOW') => void;
}

export function InventoryAlertArea({ data, onFilterStatus }: InventoryAlertAreaProps) {
  const negativeCount = data.filter((row) => getInventoryHealthStatus(row.currentQty, row.reorderLevel) === 'NEGATIVE').length;
  const lowCount = data.filter((row) => getInventoryHealthStatus(row.currentQty, row.reorderLevel) === 'LOW').length;

  if (negativeCount > 0) {
    return (
      <div className="bg-destructive/10 border-destructive/20 text-destructive flex items-center justify-between rounded-md border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-semibold">Inventory attention required</p>
            <p className="text-destructive/80 text-sm">{negativeCount} item(s) currently have negative stock.</p>
          </div>
        </div>
        <button 
          onClick={() => onFilterStatus('NEGATIVE')}
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          View Negative Stock
        </button>
      </div>
    );
  }

  if (lowCount > 0) {
    return (
      <div className="bg-warning/10 border-warning/20 text-warning-foreground flex items-center justify-between rounded-md border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <p className="font-semibold text-warning">Low stock items need attention</p>
            <p className="text-warning/80 text-sm">{lowCount} item(s) are at or below their reorder level.</p>
          </div>
        </div>
        <button 
          onClick={() => onFilterStatus('LOW')}
          className="bg-warning hover:bg-warning/90 text-warning-foreground rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          View Low Stock
        </button>
      </div>
    );
  }

  return null;
}
