import { IDatabaseAdapter } from './adapters/IDatabaseAdapter';
import { SQLCipherAdapter } from './adapters/SQLCipherAdapter';
import { SQLiteAdapter } from './adapters/SQLiteAdapter';
import { DatabaseEngine } from './DatabaseEngine';

export class DatabaseAdapterFactory {
  public static createAdapter(engine: DatabaseEngine): IDatabaseAdapter {
    if (engine === DatabaseEngine.SQLCIPHER) {
      return new SQLCipherAdapter();
    }

    return new SQLiteAdapter();
  }
}
