import { ExportFormat } from '@vyora/types';

import { IExporter, ExportDataPayload, IExportWriter } from './types';

export class CsvExporter implements IExporter {
  public readonly format = ExportFormat.CSV;

  public async export(payload: ExportDataPayload, writer: IExportWriter): Promise<void> {
    const { rows, columns, request } = payload;
    let finalColumns = columns || request.columns;

    const escapeValue = (val: unknown): string => {
      if (val === null || val === undefined) {
        return '';
      }
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Write UTF-8 BOM
    await writer.write('\uFEFF');

    let isFirstRow = true;

    for await (const row of rows) {
      if (isFirstRow && !finalColumns) {
        finalColumns = Object.keys(row).map((key) => ({ key, header: key }));
      }

      if (isFirstRow && finalColumns && finalColumns.length > 0) {
        const headerRow = finalColumns.map((col) => escapeValue(col.header)).join(',');
        await writer.write(headerRow + '\n');
        isFirstRow = false;
      }

      if (finalColumns && finalColumns.length > 0) {
        const dataRow = finalColumns.map((col) => escapeValue(row[col.key])).join(',');
        await writer.write(dataRow + '\n');
      }
    }

    if (request.totals && finalColumns && finalColumns.length > 0) {
      const totalsRow = finalColumns.map((col) => escapeValue(request.totals![col.key])).join(',');
      await writer.write(totalsRow + '\n');
    }
  }
}
