import { ExportColumn, ExportFormat, ExecutionContext, ExportRecord } from '@vyora/types';

import { ExportProvider } from '../../export/ExportProvider';
import { databaseExplorerService } from '../DatabaseExplorerService';

export interface DeveloperDatabaseExportPayload extends Record<string, unknown> {
  table: string;
}

export class DeveloperDatabaseExportProvider implements ExportProvider<DeveloperDatabaseExportPayload> {
  public readonly id = 'developer.database';

  public supports(format: ExportFormat): boolean {
    return [ExportFormat.CSV, ExportFormat.JSON].includes(format);
  }

  public async getColumns(payload?: DeveloperDatabaseExportPayload): Promise<ExportColumn[]> {
    if (!payload?.table) {
      throw new Error('Table name is required for developer.database export');
    }

    const schema = await databaseExplorerService.getTableSchema(payload.table);
    return schema.map((col) => ({
      key: String(col.name),
      header: String(col.name),
    }));
  }

  public async validate(payload?: DeveloperDatabaseExportPayload): Promise<void> {
    if (!payload?.table) {
      throw new Error('Table name is required for developer.database export');
    }
  }

  public async *getRows(
    payload?: DeveloperDatabaseExportPayload,
    _context?: ExecutionContext,
  ): AsyncGenerator<ExportRecord> {
    if (!payload?.table) {
      throw new Error('Table name is required for developer.database export');
    }

    // Note: To properly support streaming in the future, databaseExplorerService.getAllRows
    // should yield chunks. For now, we fetch all and yield them individually to satisfy the
    // streaming interface for the ExportPlatform architecture.
    const rows = await databaseExplorerService.getAllRows(payload.table);

    for (const row of rows) {
      yield row;
    }
  }
}
