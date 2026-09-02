import {
  ExportFormat,
  DirectExportRequest,
  ExportRequest,
  ExportColumn,
  ExportMetadata,
  ExportRecord,
} from '@vyora/types';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface UseExportOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useExport(options?: UseExportOptions) {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(
    async (
      format: ExportFormat,
      fileName: string,
      columns: ExportColumn[],
      rows: ExportRecord[],
      metadata?: ExportMetadata,
      totals?: ExportRecord,
    ) => {
      if (isExporting) return;

      setIsExporting(true);
      const requestId = crypto.randomUUID();

      const request: DirectExportRequest = {
        requestId,
        format,
        source: 'data',
        fileName,
        columns,
        rows,
        metadata,
        totals,
      };

      try {
        const promise = window.vyora.export.exportFile(request as ExportRequest);

        toast.promise(promise, {
          loading: 'Exporting...',
          success: (result) => {
            if (result.success && !result.cancelled) {
              return 'Export complete';
            }
            if (result.cancelled) {
              return 'Export cancelled';
            }
            throw new Error(result.error || 'Export failed');
          },
          error: (err) => err.message || 'Export failed',
        });

        const result = await promise;
        if (result.success && !result.cancelled) {
          options?.onSuccess?.();
        } else if (!result.cancelled) {
          options?.onError?.(result.error || 'Export failed');
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'An error occurred during export';
        options?.onError?.(message);
      } finally {
        setIsExporting(false);
      }
    },
    [isExporting, options],
  );

  return { exportData, isExporting };
}
