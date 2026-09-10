import {
  CreateLeaveRequestInput,
  UpdateLeaveRequestInput,
  SearchLeaveRequestsOptions,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { leaveRequestService } from '../../services/LeaveRequestService';

export function registerLeaveRequestHandlers() {
  ipcMain.handle('leave-requests:search', async (event, options: SearchLeaveRequestsOptions) => {
    try {
      const result = await leaveRequestService.search(options);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('leave-requests:getById', async (event, id: string) => {
    try {
      const result = await leaveRequestService.getById(id);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('leave-requests:create', async (event, data: CreateLeaveRequestInput) => {
    try {
      const result = await leaveRequestService.create(data);
      return { success: true, data: result };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'leave-requests:update',
    async (event, id: string, data: UpdateLeaveRequestInput) => {
      try {
        const result = await leaveRequestService.update(id, data);
        return { success: true, data: result };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle('leave-requests:delete', async (event, id: string) => {
    try {
      await leaveRequestService.delete(id);
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    'leave-requests:approve',
    async (event, id: string, data: import('@vyora/types').ApproveLeaveRequestInput) => {
      try {
        await leaveRequestService.approve(id, data);
        return { success: true };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle(
    'leave-requests:reject',
    async (event, id: string, data: import('@vyora/types').RejectLeaveRequestInput) => {
      try {
        await leaveRequestService.reject(id, data);
        return { success: true };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle(
    'leave-requests:cancel',
    async (event, id: string, data: import('@vyora/types').CancelLeaveRequestInput) => {
      try {
        await leaveRequestService.cancel(id, data);
        return { success: true };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );
}
