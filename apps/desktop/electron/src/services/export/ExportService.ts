import * as path from 'path';

import {
  ExportRequest,
  ExportSummary,
  ExportFormat,
  ExportColumn,
  ExportRecord,
} from '@vyora/types';
import { dialog } from 'electron';

import { exporterRegistry } from './ExporterRegistry';
import { exportRegistry } from './ExportRegistry';
import { FileSystemWriter } from './FileSystemWriter';
import { ExportDataPayload } from './types';

export class ExportServiceClass {
  // Helper to convert an array to an AsyncGenerator for 'data' sources
  private async *arrayToGenerator(rows: ExportRecord[]): AsyncGenerator<ExportRecord> {
    for (const row of rows) {
      yield row;
    }
  }

  public async exportFile(request: ExportRequest): Promise<ExportSummary> {
    const startTime = Date.now();

    const exporter = exporterRegistry.get(request.format);

    // Optional: Use provider's default file name if not provided
    const defaultFileName = request.fileName || `Export_${Date.now()}.${request.format}`;
    let columns: ExportColumn[] | undefined = request.columns;

    if (request.source === 'provider') {
      const provider = exportRegistry.get(request.provider);

      // Validate
      if (provider.validate) {
        await provider.validate(request.payload, request.context);
      }

      // Prepare
      if (provider.prepare) {
        await provider.prepare(request.payload, request.context);
      }

      // Check if format is supported
      if (!provider.supports(request.format)) {
        throw new Error(`Provider '${provider.id}' does not support format '${request.format}'`);
      }
    }

    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: defaultFileName,
      filters:
        request.format === ExportFormat.CSV
          ? [{ name: 'CSV Files', extensions: ['csv'] }]
          : request.format === ExportFormat.JSON
            ? [{ name: 'JSON Files', extensions: ['json'] }]
            : [{ name: 'All Files', extensions: ['*'] }], // Expand later
    });

    if (canceled || !filePath) {
      return { success: false, cancelled: true };
    }

    const writer = new FileSystemWriter(filePath);

    let rowsGenerator: AsyncGenerator<ExportRecord>;

    try {
      if (request.source === 'provider') {
        const provider = exportRegistry.get(request.provider);
        rowsGenerator = provider.getRows(request.payload, request.context);

        if (!columns && provider.getColumns) {
          columns = await provider.getColumns(request.payload, request.context);
        }
      } else {
        rowsGenerator = this.arrayToGenerator(request.rows || []);
      }

      const payload: ExportDataPayload = {
        request,
        columns,
        rows: rowsGenerator,
      };

      // Exporter writes directly to the writer
      await exporter.export(payload, writer);
      await writer.close();

      const finalFileName = path.basename(filePath);
      const summary: ExportSummary = {
        success: true,
        cancelled: false,
        filePath,
        fileName: finalFileName,
        format: request.format,
        fileSize: writer.getSize(),
        durationMs: Date.now() - startTime,
        startedAt: new Date(startTime),
        finishedAt: new Date(),
      };

      // Cleanup
      if (request.source === 'provider') {
        const provider = exportRegistry.get(request.provider);
        if (provider.cleanup) {
          await provider.cleanup(request.payload, request.context, summary);
        }
      }

      return summary;
    } catch (err: unknown) {
      // Ensure writer is closed
      await writer.close().catch(() => {});

      const errorMessage = err instanceof Error ? err.message : String(err);

      // Cleanup on error
      if (request.source === 'provider') {
        const provider = exportRegistry.get(request.provider);
        if (provider.cleanup) {
          await provider.cleanup(request.payload, request.context, {
            success: false,
            cancelled: false,
            error: errorMessage,
          });
        }
      }

      return {
        success: false,
        cancelled: false,
        error: errorMessage,
      };
    }
  }
}

export const exportService = new ExportServiceClass();
