import { ApiResponse } from '@vyora/types';
import { ipcMain } from 'electron';

import { loggerService as log } from '../services/logger/LoggerService';

/**
 * Standardized Error Contract for UI
 */
export interface ErrorContract {
  success: false;
  error: string;
  code: string;
  details?: unknown;
  retryable: boolean;
  validations?: unknown[];
}

/**
 * Maps any internal error to the standardized ErrorContract
 */
export function mapErrorToContract(err: unknown): ErrorContract {
  if (err instanceof Error) {
    // Check for SQLITE_BUSY
    if (
      (err as unknown as Record<string, unknown>).code === 'SQLITE_BUSY' ||
      err.message.includes('SQLITE_BUSY')
    ) {
      return {
        success: false,
        error: 'The database is currently busy processing another request. Please try again.',
        code: 'ERR_SQLITE_BUSY',
        retryable: true,
      };
    }

    // Check for UNIQUE constraint violations
    if (
      (err as unknown as Record<string, unknown>).code === 'SQLITE_CONSTRAINT_UNIQUE' ||
      err.message.includes('UNIQUE constraint failed')
    ) {
      return {
        success: false,
        error:
          'A record with this identifier already exists. Please check your data and try again.',
        code: 'ERR_SQLITE_CONSTRAINT_UNIQUE',
        retryable: false,
      };
    }

    // Check for FOREIGN KEY violations
    if (
      (err as unknown as Record<string, unknown>).code === 'SQLITE_CONSTRAINT_FOREIGNKEY' ||
      err.message.includes('FOREIGN KEY constraint failed')
    ) {
      return {
        success: false,
        error: 'This operation references a record that does not exist or has been deleted.',
        code: 'ERR_SQLITE_CONSTRAINT_FOREIGNKEY',
        retryable: false,
      };
    }

    // Check for StockValidationError or other explicit validation errors
    if (err.name === 'StockValidationError') {
      return {
        success: false,
        error: err.message,
        code: 'ERR_VALIDATION',
        validations: (err as unknown as Record<string, unknown>).validations as unknown[],
        retryable: false,
      };
    }

    if (err.name === 'ValidationError') {
      return {
        success: false,
        error: err.message,
        code: 'ERR_VALIDATION',
        details: (err as unknown as Record<string, unknown>).details,
        retryable: false,
      };
    }

    // Fallback for general errors
    log?.error?.(`[IPC Error] ${err.name}: ${err.message}`, { stack: err.stack });
    return {
      success: false,
      error: err.message,
      code: 'ERR_INTERNAL',
      retryable: false,
    };
  }

  // Handle non-Error throws
  log?.error?.(`[IPC Error] Unknown error:`, err);
  return {
    success: false,
    error: 'An unexpected error occurred.',
    code: 'ERR_UNKNOWN',
    retryable: false,
  };
}

/**
 * Creates a centralized IPC handler that automatically catches exceptions
 * and maps them to the standardized ErrorContract.
 */
export function createIpcHandler<T>(
  channel: string,
  handler: (event: Electron.IpcMainInvokeEvent, ...args: unknown[]) => Promise<ApiResponse<T>>,
) {
  ipcMain.handle(channel, async (event, ...args): Promise<ApiResponse<T> | ErrorContract> => {
    try {
      return await handler(event, ...args);
    } catch (err: unknown) {
      return mapErrorToContract(err);
    }
  });
}
