import * as path from 'path';
import { Writable } from 'stream';

import { ExportFormat, ExportRecord } from '@vyora/types';

import { IExporter, ExportDataPayload, IExportWriter } from './types';

// Use require since pdfmake default export might be tricky in ts
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinterModule = require('pdfmake/js/Printer.js');

const PdfPrinter = PdfPrinterModule.default || PdfPrinterModule;

class WriterStream extends Writable {
  constructor(private writer: IExportWriter) {
    super();
  }
  _write(chunk: string | Buffer, encoding: string, callback: (error?: Error | null) => void) {
    this.writer
      .write(chunk)
      .then(() => callback())
      .catch(callback);
  }
}

export class PdfExporter implements IExporter {
  public readonly format = ExportFormat.PDF;

  public async export(payload: ExportDataPayload, writer: IExportWriter): Promise<void> {
    const { rows, columns, request } = payload;
    let finalColumns = columns || request.columns;

    // Load fonts
    const pdfmakeModulePath = require.resolve('pdfmake');
    const fontsDir = path.join(path.dirname(pdfmakeModulePath), '../fonts/Roboto');

    const fonts = {
      Roboto: {
        normal: path.join(fontsDir, 'Roboto-Regular.ttf'),
        bold: path.join(fontsDir, 'Roboto-Medium.ttf'),
        italics: path.join(fontsDir, 'Roboto-Italic.ttf'),
        bolditalics: path.join(fontsDir, 'Roboto-MediumItalic.ttf'),
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const URLResolverModule = require('pdfmake/js/URLResolver');
    const URLResolver = URLResolverModule.default || URLResolverModule;
    const urlResolver = new URLResolver({});

    const printer = new PdfPrinter(fonts, null, urlResolver, () => true);

    // Read all rows
    const allRows: ExportRecord[] = [];
    for await (const row of rows) {
      allRows.push(row);
    }

    if (!finalColumns && allRows.length > 0) {
      finalColumns = Object.keys(allRows[0]).map((key) => ({ key, header: key }));
    }

    const content: unknown[] = [];

    // Header Metadata
    if (request.metadata) {
      if (request.metadata.companyName) {
        content.push({ text: request.metadata.companyName, style: 'companyName' });
      }
      if (request.metadata.title) {
        content.push({ text: request.metadata.title, style: 'title' });
      }
      if (request.metadata.subtitle) {
        content.push({ text: request.metadata.subtitle, style: 'subtitle' });
      }
      if (request.metadata.asOfDate) {
        let dateStr = request.metadata.asOfDate;
        if (dateStr instanceof Date) {
          dateStr = dateStr.toLocaleDateString();
        }
        content.push({ text: `Date: ${dateStr}`, style: 'date' });
      }
      content.push({ text: '\n' });
    }

    if (finalColumns && finalColumns.length > 0) {
      const tableBody: unknown[][] = [];

      // Header Row
      const headerRow = finalColumns.map((col) => ({
        text: col.header,
        style: 'tableHeader',
        alignment: col.type === 'currency' || col.type === 'number' ? 'right' : 'left',
      }));
      tableBody.push(headerRow);

      // Data Rows
      for (const row of allRows) {
        const dataRow = finalColumns.map((col) => {
          const val = row[col.key];
          let formattedVal = val === null || val === undefined ? '' : String(val);

          if (col.type === 'currency' && typeof val === 'number') {
            formattedVal = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              minimumFractionDigits: 2,
            }).format(val);
          } else if (col.type === 'number' && typeof val === 'number') {
            formattedVal = new Intl.NumberFormat('en-IN', {
              minimumFractionDigits: 2,
            }).format(val);
          } else if (col.type === 'date' && val instanceof Date) {
            formattedVal = val.toLocaleDateString();
          }

          return {
            text: formattedVal,
            alignment: col.type === 'currency' || col.type === 'number' ? 'right' : 'left',
          };
        });
        tableBody.push(dataRow);
      }

      // Totals
      if (request.totals) {
        const totalsRow = finalColumns.map((col) => {
          const val = request.totals![col.key];
          let formattedVal = val === null || val === undefined ? '' : String(val);

          if (col.type === 'currency' && typeof val === 'number') {
            formattedVal = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              minimumFractionDigits: 2,
            }).format(val);
          } else if (col.type === 'number' && typeof val === 'number') {
            formattedVal = new Intl.NumberFormat('en-IN', {
              minimumFractionDigits: 2,
            }).format(val);
          }

          return {
            text: formattedVal,
            style: 'tableTotal',
            alignment: col.type === 'currency' || col.type === 'number' ? 'right' : 'left',
          };
        });
        tableBody.push(totalsRow);
      }

      // Calculate relative widths. E.g. narration is longer, amounts are smaller.
      // We will just use '*' for all, which distributes them evenly.
      content.push({
        table: {
          headerRows: 1,
          widths: finalColumns.map(() => '*'),
          body: tableBody,
        },
        layout: 'lightHorizontalLines',
      });
    }

    const docDefinition: unknown = {
      content,
      styles: {
        companyName: { fontSize: 16, bold: true, margin: [0, 0, 0, 4] },
        title: { fontSize: 14, bold: true, margin: [0, 0, 0, 4] },
        subtitle: { fontSize: 12, italics: true, margin: [0, 0, 0, 4] },
        date: { fontSize: 10, margin: [0, 0, 0, 8] },
        tableHeader: { bold: true, fontSize: 11, color: 'black' },
        tableTotal: { bold: true, fontSize: 10, color: 'black' },
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
      },
    };

    const pdfDoc = await printer.createPdfKitDocument(docDefinition);
    const stream = new WriterStream(writer);

    return new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
      pdfDoc.pipe(stream);
      pdfDoc.end();
    });
  }
}
