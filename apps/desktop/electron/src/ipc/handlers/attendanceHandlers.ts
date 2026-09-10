import {
  aggregateAttendanceOptionsSchema,
  clearAttendanceInputSchema,
  markAttendanceInputSchema,
  searchAttendanceOptionsSchema,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { attendanceAggregationService } from '../../services/AttendanceAggregationService';
import { attendanceService } from '../../services/AttendanceService';

export function registerAttendanceHandlers() {
  ipcMain.handle('attendance:search', async (_, options) => {
    try {
      const parsedOptions = searchAttendanceOptionsSchema.parse(options);
      const result = await attendanceService.search(parsedOptions);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('attendance:getById', async (_, id: string) => {
    try {
      const result = await attendanceService.getById(id);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('attendance:mark', async (_, data) => {
    try {
      const parsedData = markAttendanceInputSchema.parse(data);
      const result = await attendanceService.mark(parsedData);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('attendance:clear', async (_, data) => {
    try {
      const parsedData = clearAttendanceInputSchema.parse(data);
      await attendanceService.clear(parsedData);
      return { success: true, data: null };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('attendance:aggregate', async (_, options) => {
    try {
      const parsedOptions = aggregateAttendanceOptionsSchema.parse(options);
      const result = await attendanceAggregationService.aggregateEmployeeAttendance(parsedOptions);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });
}
