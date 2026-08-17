import { ExportColumn, ExportFormat, ExportRecord, ExportRequest } from '@vyora/types';

export interface ExportDataPayload {
  request: ExportRequest;
  columns?: ExportColumn[];
  rows: AsyncGenerator<ExportRecord>;
}

export interface IExporter {
  readonly format: ExportFormat;
  export(data: ExportDataPayload, writer: IExportWriter): Promise<void>;
}

export interface IExportWriter {
  /**
   * Writes a chunk of data to the destination
   */
  write(chunk: string | Buffer): Promise<void>;

  /**
   * Closes the writer
   */
  close(): Promise<void>;

  /**
   * Gets the final file path (if applicable)
   */
  getFilePath?(): string;

  /**
   * Gets the final file size in bytes
   */
  getSize?(): number;
}
