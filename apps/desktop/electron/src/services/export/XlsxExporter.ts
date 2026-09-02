import { Writable } from 'stream';

import { ExportFormat, ExportRecord } from '@vyora/types';
import * as ExcelJS from 'exceljs';

import { IExporter, ExportDataPayload, IExportWriter } from './types';

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

export class XlsxExporter implements IExporter {
  public readonly format = ExportFormat.XLSX;

  public async export(payload: ExportDataPayload, writer: IExportWriter): Promise<void> {
    const { rows, columns, request } = payload;
    let finalColumns = columns || request.columns;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = request.metadata?.generatedBy || 'Vyora System';
    workbook.lastModifiedBy = workbook.creator;
    workbook.created = request.metadata?.generatedAt || new Date();
    workbook.modified = workbook.created;

    const sheetName = request.metadata?.title ? request.metadata.title.substring(0, 31) : 'Export';
    const sheet = workbook.addWorksheet(sheetName, {
      views: [{ showGridLines: false }],
    });

    let currentRowNumber = 1;

    // Write Metadata Headers
    if (request.metadata) {
      if (request.metadata.companyName) {
        sheet.getCell(`A${currentRowNumber}`).value = request.metadata.companyName;
        sheet.getCell(`A${currentRowNumber}`).font = { bold: true, size: 14 };
        currentRowNumber++;
      }
      if (request.metadata.title) {
        sheet.getCell(`A${currentRowNumber}`).value = request.metadata.title;
        sheet.getCell(`A${currentRowNumber}`).font = { bold: true, size: 12 };
        currentRowNumber++;
      }
      if (request.metadata.subtitle) {
        sheet.getCell(`A${currentRowNumber}`).value = request.metadata.subtitle;
        sheet.getCell(`A${currentRowNumber}`).font = { italic: true };
        currentRowNumber++;
      }
      if (request.metadata.asOfDate) {
        let dateStr = request.metadata.asOfDate;
        if (dateStr instanceof Date) {
          dateStr = dateStr.toLocaleDateString();
        }
        sheet.getCell(`A${currentRowNumber}`).value = `Date: ${dateStr}`;
        currentRowNumber++;
      }
      // Empty row
      currentRowNumber++;
    }

    // Determine Columns
    const tempFirstRow = await rows.next();
    if (!finalColumns && !tempFirstRow.done && tempFirstRow.value) {
      finalColumns = Object.keys(tempFirstRow.value).map((key) => ({ key, header: key }));
    }

    // Write Header Row
    if (finalColumns && finalColumns.length > 0) {
      const headerRow = sheet.getRow(currentRowNumber);
      finalColumns.forEach((col, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = col.header;
        cell.font = { bold: true };
        cell.border = { bottom: { style: 'medium', color: { argb: 'FF000000' } } };
      });
      headerRow.commit();

      // Set Column formatting
      finalColumns.forEach((col, index) => {
        const excelCol = sheet.getColumn(index + 1);
        excelCol.key = col.key;

        // Width estimation
        excelCol.width = Math.max(col.header.length + 5, 15);

        let numFmt = undefined;
        const alignment: Partial<ExcelJS.Alignment> = { vertical: 'top', wrapText: true };

        if (col.type === 'currency') {
          numFmt = '₹#,##0.00;[Red]-₹#,##0.00';
          alignment.horizontal = 'right';
        } else if (col.type === 'number') {
          numFmt = '#,##0.00';
          alignment.horizontal = 'right';
        } else if (col.type === 'date') {
          numFmt = 'dd-mmm-yyyy';
        }

        excelCol.numFmt = numFmt;
        excelCol.alignment = alignment;
      });

      // Freeze headers
      sheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: currentRowNumber, showGridLines: false },
      ];

      currentRowNumber++;
    }

    // Process rows
    const writeDataRow = (row: ExportRecord) => {
      const dataRow = sheet.getRow(currentRowNumber);
      if (finalColumns && finalColumns.length > 0) {
        finalColumns.forEach((col, index) => {
          dataRow.getCell(index + 1).value = row[col.key] as ExcelJS.CellValue;
        });
      } else {
        // Fallback if no columns
        Object.values(row).forEach((val, index) => {
          dataRow.getCell(index + 1).value = val as ExcelJS.CellValue;
        });
      }
      dataRow.commit();
      currentRowNumber++;
    };

    if (!tempFirstRow.done && tempFirstRow.value) {
      writeDataRow(tempFirstRow.value);
    }

    for await (const row of rows) {
      writeDataRow(row);
    }

    // Process totals
    if (request.totals && finalColumns && finalColumns.length > 0) {
      const totalsRow = sheet.getRow(currentRowNumber);
      finalColumns.forEach((col, index) => {
        const cell = totalsRow.getCell(index + 1);
        cell.value = request.totals![col.key] as ExcelJS.CellValue;
        cell.font = { bold: true };
        cell.border = { top: { style: 'thin', color: { argb: 'FF000000' } } };
      });
      totalsRow.commit();
    }

    // Write to stream
    const stream = new WriterStream(writer);
    await workbook.xlsx.write(stream);
  }
}
