import { ExportFormat } from '@vyora/types';

import { IExporter, ExportDataPayload, IExportWriter } from './types';

export class JsonExporter implements IExporter {
  public readonly format = ExportFormat.JSON;

  public async export(payload: ExportDataPayload, writer: IExportWriter): Promise<void> {
    const { rows } = payload;

    await writer.write('[\n');
    let isFirstRow = true;

    for await (const row of rows) {
      if (!isFirstRow) {
        await writer.write(',\n');
      }
      await writer.write('  ' + JSON.stringify(row));
      isFirstRow = false;
    }

    await writer.write('\n]\n');
  }
}
