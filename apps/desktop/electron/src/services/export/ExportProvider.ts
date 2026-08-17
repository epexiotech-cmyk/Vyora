import {
  ExportColumn,
  ExportFormat,
  ExecutionContext,
  ExportRecord,
  ExportSummary,
} from '@vyora/types';

export interface ExportProvider<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  /**
   * The unique identifier for this provider, e.g., 'developer.database'
   */
  readonly id: string;

  /**
   * Returns whether this provider supports the given export format
   */
  supports(format: ExportFormat): boolean;

  /**
   * Optional title for this export
   */
  title?(): string;

  /**
   * Optional description for this export
   */
  description?(): string;

  /**
   * Optional method to fetch specific column configurations for this export
   */
  getColumns?(payload?: TPayload, context?: ExecutionContext): Promise<ExportColumn[]>;

  /**
   * Validate the request before any preparation begins (e.g., check permissions, inputs).
   * Throw an error if validation fails.
   */
  validate?(payload?: TPayload, context?: ExecutionContext): Promise<void>;

  /**
   * Prepare resources for export (e.g., caching, totals)
   */
  prepare?(payload?: TPayload, context?: ExecutionContext): Promise<void>;

  /**
   * Mandatory method to stream the rows to be exported
   */
  getRows(
    payload?: TPayload,
    context?: ExecutionContext,
    // cancellationToken?: CancellationToken, // To be added in Phase 2
  ): AsyncGenerator<ExportRecord>;

  /**
   * Cleanup any resources after the export is complete or if it failed
   */
  cleanup?(payload?: TPayload, context?: ExecutionContext, summary?: ExportSummary): Promise<void>;
}
