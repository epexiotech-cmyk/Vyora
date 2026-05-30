export enum DatabaseEngine {
  SQLITE = 'SQLITE',
  SQLCIPHER = 'SQLCIPHER',
}

export const DEFAULT_DATABASE_ENGINE = DatabaseEngine.SQLCIPHER;
