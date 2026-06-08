import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

export function createTestDatabase() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite);

  return {
    sqlite,
    db,
    close: () => {
      if (sqlite.open) {
        sqlite.close();
      }
    },
  };
}
