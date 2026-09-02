import * as path from 'path';
import * as os from 'os';
import {
  ExportFormat,
  DirectExportRequest,
  ExportColumn,
  ExportMetadata,
  ExportRecord,
} from '@vyora/types';
import { exportService } from './ExportService';
import { exporterRegistry } from './ExporterRegistry';

// Need to mock Electron dialog for the test since we are not in Electron process
// We can override the `dialog.showSaveDialog` but `ExportService.ts` imports `dialog` from `electron`.
// If we run outside Electron, importing `electron` will fail.
// So we will just instantiate the Exporter directly and use FileSystemWriter.
import { FileSystemWriter } from './FileSystemWriter';
import { XlsxExporter } from './XlsxExporter';
import { PdfExporter } from './PdfExporter';
import { CsvExporter } from './CsvExporter';
import { JsonExporter } from './JsonExporter';

async function runTests() {
  const testDir = path.join(os.tmpdir(), 'vyora-export-tests');
  const fs = await import('fs');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  const columns: ExportColumn[] = [
    { key: 'date', header: 'Date', type: 'date' },
    { key: 'voucherNo', header: 'Voucher No', type: 'string' },
    { key: 'narration', header: 'Narration', type: 'string' },
    { key: 'debit', header: 'Debit (₹)', type: 'currency' },
    { key: 'credit', header: 'Credit (₹)', type: 'currency' },
  ];

  const metadata: ExportMetadata = {
    title: 'Account Ledger Statement',
    subtitle: 'Epexio Cash Account',
    companyName: 'Vyora Technologies',
    asOfDate: new Date('2026-08-25'),
    generatedBy: 'System Test',
    generatedAt: new Date(),
  };

  const rows: ExportRecord[] = [
    {
      date: new Date('2026-08-01'),
      voucherNo: 'OB-01',
      narration: 'Opening Balance',
      debit: 50000.0,
      credit: 0,
    },
    {
      date: new Date('2026-08-15'),
      voucherNo: 'JV-001',
      narration:
        'Office expenses and supplies, long narration to test text wrapping inside PDF and Excel columns, ensure it works smoothly.',
      debit: 0,
      credit: 1545.5,
    },
    {
      date: new Date('2026-08-20'),
      voucherNo: 'RV-002',
      narration: 'Payment received from client',
      debit: 25000.0,
      credit: 0,
    },
  ];

  const totals: ExportRecord = {
    date: null,
    voucherNo: null,
    narration: 'Closing Balance',
    debit: 75000.0,
    credit: 1545.5,
  };

  const request: DirectExportRequest = {
    requestId: 'test-1',
    format: ExportFormat.CSV,
    source: 'data',
    metadata,
    columns,
    totals,
  };

  async function* getRows() {
    for (const r of rows) yield r;
  }

  const formats = [
    { format: ExportFormat.CSV, ext: 'csv', exporter: new CsvExporter() },
    { format: ExportFormat.JSON, ext: 'json', exporter: new JsonExporter() },
    { format: ExportFormat.XLSX, ext: 'xlsx', exporter: new XlsxExporter() },
    { format: ExportFormat.PDF, ext: 'pdf', exporter: new PdfExporter() },
  ];

  for (const f of formats) {
    console.log(`Testing ${f.format}...`);
    const filePath = path.join(testDir, `test_export.${f.ext}`);
    const writer = new FileSystemWriter(filePath);

    request.format = f.format;
    const payload = {
      request,
      columns,
      rows: getRows(),
    };

    try {
      await f.exporter.export(payload, writer);
      await writer.close();
      console.log(`✅ Successfully generated ${filePath}`);
    } catch (e) {
      console.error(`❌ Failed generating ${f.format}:`, e);
    }
  }
}

runTests();
