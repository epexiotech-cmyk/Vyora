import { ExportFormat } from '@vyora/types';

import { IExporter, ExportDataPayload, IExportWriter } from './types';

export class JsonExporter implements IExporter {
  public readonly format = ExportFormat.JSON;

  public async export(payload: ExportDataPayload, writer: IExportWriter): Promise<void> {
    const { rows, columns, request } = payload;

    await writer.write('{\n');

    // Write metadata
    if (request.metadata) {
      await writer.write(`  "metadata": ${JSON.stringify(request.metadata)},\n`);
    }

    // Write columns
    if (columns) {
      await writer.write(`  "columns": ${JSON.stringify(columns)},\n`);
    }

    // Write rows
    await writer.write('  "rows": [\n');
    let isFirstRow = true;

    for await (const row of rows) {
      if (!isFirstRow) {
        await writer.write(',\n');
      }
      await writer.write('    ' + JSON.stringify(row));
      isFirstRow = false;
    }
    await writer.write('\n  ]');

    // Write totals
    if (request.totals) {
      await writer.write(`,\n  "totals": ${JSON.stringify(request.totals)}\n`);
    } else {
      await writer.write('\n');
    }

    await writer.write('}\n');
  }
}
