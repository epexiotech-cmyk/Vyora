import { ExportRequest } from '@vyora/types';
import { ipcMain } from 'electron';

import { DeveloperDatabaseExportProvider } from '../../services/developer/export/DeveloperDatabaseExportProvider';
import { exportRegistry } from '../../services/export/ExportRegistry';
import { exportService } from '../../services/export/ExportService';

export function registerExportHandlers() {
  // Register default providers
  exportRegistry.register(new DeveloperDatabaseExportProvider());

  ipcMain.handle('export:file', async (_, request: ExportRequest) => {
    return await exportService.exportFile(request);
  });
}
