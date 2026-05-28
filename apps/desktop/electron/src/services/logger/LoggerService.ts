import * as path from 'path';

import { app } from 'electron';
import log from 'electron-log';

export class LoggerService {
  constructor() {
    const userDataPath = app.getPath('userData');
    const logPath = path.join(userDataPath, 'logs', 'app.log');

    log.transports.file.resolvePathFn = () => logPath;
    log.transports.file.level = 'info';
    log.transports.console.level = !app.isPackaged ? 'debug' : false;

    // Catch unhandled errors
    log.catchErrors({
      showDialog: false,
      onError(error) {
        log.error('Uncaught Exception:', error);
      },
    });

    process.on('unhandledRejection', (reason) => {
      log.error('Unhandled Rejection:', reason);
    });
  }

  public init() {
    this.info('Logger initialized.');
  }

  public info(message: string, ...args: unknown[]) {
    log.info(message, ...args);
  }

  public warn(message: string, ...args: unknown[]) {
    log.warn(message, ...args);
  }

  public error(message: string, ...args: unknown[]) {
    log.error(message, ...args);
  }

  public debug(message: string, ...args: unknown[]) {
    log.debug(message, ...args);
  }
}

export const loggerService = new LoggerService();
