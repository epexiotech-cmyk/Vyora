import { ExportFormat } from '@vyora/types';
import { Download, Copy, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import React from 'react';

import { useDeveloperExplorer } from '../context/DeveloperExplorerContext';
import { DeveloperWorkspaceTab } from '../types';

import { Button } from '@/components/ui/button';

export function ExplorerToolbar() {
  const { activeTab, selectedTable, page, pageSize, totalRows, setPage } = useDeveloperExplorer();

  if (activeTab !== DeveloperWorkspaceTab.DATA || !selectedTable) {
    return (
      <div className="flex items-center justify-between border-b py-2">
        <div className="text-muted-foreground text-sm">Select a table to view data</div>
      </div>
    );
  }

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

      const result = await window.vyora.export.exportFile({
        requestId: crypto.randomUUID(),
        source: 'provider',
        provider: 'developer.database',
        format: format === 'csv' ? ExportFormat.CSV : ExportFormat.JSON,
        fileName: `${selectedTable}_${timestamp}.${format}`,
        payload: {
          table: selectedTable,
        },
      });

      if (result.success) {
        import('sonner').then(({ toast }) => {
          toast.success(`Export Complete`, {
            description: (
              <div className="mt-1 flex flex-col gap-1">
                <div className="text-foreground font-medium">{result.fileName}</div>
                <div className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>Rows: {result.rowCount?.toLocaleString()}</div>
                  <div>
                    Size:{' '}
                    {result.fileSize
                      ? (result.fileSize / 1024 / 1024).toFixed(2) + ' MB'
                      : 'Unknown'}
                  </div>
                  <div>
                    Time:{' '}
                    {result.durationMs ? (result.durationMs / 1000).toFixed(1) + ' sec' : 'Unknown'}
                  </div>
                </div>
              </div>
            ),
            action: {
              label: 'Open',
              onClick: () => window.vyora.system.openPath(result.filePath!),
            },
          });
        });
      } else if (!result.cancelled) {
        import('sonner').then(({ toast }) => {
          toast.error(result.error || 'Export failed');
        });
      }
    } catch {
      import('sonner').then(({ toast }) => {
        toast.error('An unexpected error occurred during export');
      });
    }
  };

  const exportCSV = () => handleExport('csv');
  const exportJSON = () => handleExport('json');

  return (
    <div className="flex items-center justify-between py-2">
      {/* Left side actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          CSV
        </Button>
        <Button variant="outline" size="sm" onClick={exportJSON}>
          <Copy className="mr-2 h-4 w-4" />
          JSON
        </Button>
        <Button variant="ghost" size="icon" title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Right side pagination */}
      <div className="flex items-center gap-4">
        <div className="text-muted-foreground text-sm">
          Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalRows)} of{' '}
          {totalRows}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={page * pageSize >= totalRows}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
