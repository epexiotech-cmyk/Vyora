import {
  CreateAdminRequestSchema,
  LoginRequestSchema,
  UnlockRequestSchema,
  ChangePasswordRequestSchema,
  ChangePinRequestSchema,
  ZodError,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { authService } from '../../services/AuthService';
import { loggerService } from '../../services/logger/LoggerService';

export function registerAuthHandlers() {
  ipcMain.handle('auth:create-admin', async (_, payload) => {
    try {
      const parsed = CreateAdminRequestSchema.parse(payload);
      await authService.createAdmin(parsed);
      return { success: true, data: null };
    } catch (error) {
      if (error instanceof ZodError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { success: false, error: 'Validation failed', validations: (error as any).errors };
      }
      loggerService.error('Error creating admin:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('auth:login', async (_, payload) => {
    try {
      const parsed = LoginRequestSchema.parse(payload);
      const user = await authService.login(parsed.username, parsed.password, parsed.rememberMe);
      return { success: true, data: user };
    } catch (error) {
      if (error instanceof ZodError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { success: false, error: 'Validation failed', validations: (error as any).errors };
      }
      loggerService.error('Error logging in:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('auth:verify-session', async () => {
    try {
      let user = authService.getCurrentUser();
      if (!user) {
        user = await authService.verifyPersistentSession();
      }

      if (user) {
        if (authService.isSessionLocked()) {
          return { success: true, data: { isLocked: true } };
        }
        return { success: true, data: user };
      }
      return { success: false, error: 'Session invalid' };
    } catch (error) {
      loggerService.error('IPC: auth:verify-session failed', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('auth:logout', async () => {
    try {
      await authService.logout();
      return { success: true, data: null };
    } catch (error) {
      loggerService.error('Error logging out:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('auth:lock', () => {
    authService.lockSession();
    return { success: true, data: null };
  });

  ipcMain.handle('auth:unlock', async (_, payload) => {
    try {
      const parsed = UnlockRequestSchema.parse(payload);
      const success = await authService.unlockSession(parsed.pinOrPassword);
      if (success) {
        return { success: true, data: null };
      }
      return { success: false, error: 'Invalid PIN or password' };
    } catch (error) {
      if (error instanceof ZodError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { success: false, error: 'Validation failed', validations: (error as any).errors };
      }
      loggerService.error('Error unlocking session:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('auth:is-locked', () => {
    return { success: true, data: authService.isSessionLocked() };
  });

  ipcMain.handle('auth:get-current-user', () => {
    const user = authService.getCurrentUser();
    if (user) {
      return { success: true, data: user };
    }
    return { success: false, error: 'Not logged in' };
  });

  ipcMain.handle('auth:change-password', async (_, payload) => {
    try {
      const parsed = ChangePasswordRequestSchema.parse(payload);
      await authService.changePassword(parsed.currentPassword, parsed.newPassword);
      return { success: true, data: null };
    } catch (error) {
      if (error instanceof ZodError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { success: false, error: 'Validation failed', validations: (error as any).errors };
      }
      loggerService.error('Error changing password:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('auth:change-pin', async (_, payload) => {
    try {
      const parsed = ChangePinRequestSchema.parse(payload);
      await authService.changePin(parsed.oldPin, parsed.newPin);
      return { success: true, data: null };
    } catch (error) {
      if (error instanceof ZodError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { success: false, error: 'Validation failed', validations: (error as any).errors };
      }
      loggerService.error('Error changing PIN:', error);
      return { success: false, error: (error as Error).message };
    }
  });
}
