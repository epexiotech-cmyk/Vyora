import { ExecutionContext } from '../platform/context';

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx',
  PDF = 'pdf',
  ZIP = 'zip',
  XML = 'xml',
}

export interface ExportColumn {
  key: string;
  header: string;
  type?: 'string' | 'number' | 'date' | 'boolean' | 'currency';
  format?: string;
  hidden?: boolean;
}

export interface ExportMetadata {
  title?: string;
  subtitle?: string;
  companyName?: string;
  companyAddress?: string;
  asOfDate?: Date | string;
  generatedBy?: string;
  generatedAt?: Date;
  version?: string;
  filters?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BaseExportRequest {
  requestId: string;
  format: ExportFormat;
  fileName?: string;
  title?: string;
  columns?: ExportColumn[];
  metadata?: ExportMetadata;
  totals?: ExportRecord;
}

export type ExportRecord = Record<string, unknown>;

export interface DirectExportRequest extends BaseExportRequest {
  source: 'data';
  rows?: ExportRecord[];
  data?: unknown;
}

export interface ProviderExportRequest extends BaseExportRequest {
  source: 'provider';
  provider: string;
  context?: ExecutionContext;
  payload?: Record<string, unknown>;
}

export type ExportRequest = DirectExportRequest | ProviderExportRequest;

export interface ExportSummary {
  success: boolean;
  cancelled: boolean;
  format?: string;
  fileName?: string;
  filePath?: string;
  rowCount?: number;
  fileSize?: number;
  durationMs?: number;
  startedAt?: Date;
  finishedAt?: Date;
  error?: string;
}

export enum ExportStage {
  Preparing = 'Preparing',
  Fetching = 'Fetching',
  Transforming = 'Transforming',
  Serializing = 'Serializing',
  Writing = 'Writing',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Failed = 'Failed',
}

export interface ExportProgress {
  requestId: string;
  stage: ExportStage;
  processedRows: number;
  totalRows?: number;
  percent?: number;
  timestamp: Date;
}
