import { execFileSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// electron is a CJS export containing the path to the binary
import electronPath from 'electron';

export class DBClient {
  constructor(public dbPath: string) {}

  query<T>(sql: string, params: unknown[] = []): T[] {
    const script = `
      const keytar = require('keytar');
      const Database = require('better-sqlite3-multiple-ciphers');
      
      keytar.getPassword('Vyora', 'master-encryption-key').then(key => {
        const db = new Database(process.env.DB_PATH);
        db.pragma(\`KEY = '\${key}'\`);
        db.pragma('cipher_page_size = 4096');
        db.pragma('kdf_iter = 64000');
        db.pragma('cipher_hmac_algorithm = HMAC_SHA512');
        db.pragma('cipher_kdf_algorithm = PBKDF2_HMAC_SHA512');

        const stmt = db.prepare(process.argv[1]);
        const result = stmt.all(...JSON.parse(process.argv[2]));
        console.log(JSON.stringify(result));
      }).catch(err => {
        console.error(err);
        process.exit(1);
      });
    `;
    const output = execFileSync(
      electronPath as unknown as string,
      ['-e', script, sql, JSON.stringify(params)],
      {
        env: { ...process.env, DB_PATH: this.dbPath, ELECTRON_RUN_AS_NODE: '1' },
        encoding: 'utf-8',
      },
    );
    return JSON.parse(output.trim());
  }

  queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
    const script = `
      const keytar = require('keytar');
      const Database = require('better-sqlite3-multiple-ciphers');
      
      keytar.getPassword('Vyora', 'master-encryption-key').then(key => {
        const db = new Database(process.env.DB_PATH);
        db.pragma(\`KEY = '\${key}'\`);
        db.pragma('cipher_page_size = 4096');
        db.pragma('kdf_iter = 64000');
        db.pragma('cipher_hmac_algorithm = HMAC_SHA512');
        db.pragma('cipher_kdf_algorithm = PBKDF2_HMAC_SHA512');

        const stmt = db.prepare(process.argv[1]);
        const result = stmt.get(...JSON.parse(process.argv[2]));
        console.log(JSON.stringify(result || null));
      }).catch(err => {
        console.error(err);
        process.exit(1);
      });
    `;
    const output = execFileSync(
      electronPath as unknown as string,
      ['-e', script, sql, JSON.stringify(params)],
      {
        env: { ...process.env, DB_PATH: this.dbPath, ELECTRON_RUN_AS_NODE: '1' },
        encoding: 'utf-8',
      },
    );
    const parsed = JSON.parse(output.trim());
    return parsed === null ? undefined : parsed;
  }

  execute(sql: string, params: unknown[] = []): void {
    const script = `
      const keytar = require('keytar');
      const Database = require('better-sqlite3-multiple-ciphers');
      
      keytar.getPassword('Vyora', 'master-encryption-key').then(key => {
        const db = new Database(process.env.DB_PATH);
        db.pragma(\`KEY = '\${key}'\`);
        db.pragma('cipher_page_size = 4096');
        db.pragma('kdf_iter = 64000');
        db.pragma('cipher_hmac_algorithm = HMAC_SHA512');
        db.pragma('cipher_kdf_algorithm = PBKDF2_HMAC_SHA512');

        const stmt = db.prepare(process.argv[1]);
        stmt.run(...JSON.parse(process.argv[2]));
        console.log(JSON.stringify({ success: true }));
      }).catch(err => {
        console.error(err);
        process.exit(1);
      });
    `;
    execFileSync(electronPath as unknown as string, ['-e', script, sql, JSON.stringify(params)], {
      env: { ...process.env, DB_PATH: this.dbPath, ELECTRON_RUN_AS_NODE: '1' },
      encoding: 'utf-8',
    });
  }

  close() {
    // No persistent connection to close
  }
}

/**
 * Creates a fresh, isolated temporary database for E2E testing.
 */
export async function setupTestDatabase(): Promise<DBClient> {
  const tempId = crypto.randomBytes(8).toString('hex');
  const dbName = `test_db_${tempId}.vyr`;
  const dbPath = path.join(process.cwd(), 'tests', 'e2e', 'fixtures', 'temp', dbName);

  await fs.mkdir(path.dirname(dbPath), { recursive: true });
  await fs.writeFile(dbPath, ''); // In reality, copy a seed.sqlite here

  return new DBClient(dbPath);
}

/**
 * Cleans up the temporary database after a test suite.
 */
export async function cleanupTestDatabase(client: DBClient): Promise<void> {
  try {
    const dbPath = client.dbPath;
    client.close();
    await fs.unlink(dbPath);
  } catch (error) {
    console.warn(`Failed to cleanup test database:`, error);
  }
}
