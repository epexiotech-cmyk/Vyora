import { sql } from 'drizzle-orm';

import { dbService } from '../database/DatabaseService';

import { inspectorRegistry, InspectorRelation } from './InspectorRegistry';
import { QueryValidator } from './QueryValidator';

export class DatabaseExplorerService {
  public async listTables(): Promise<{ name: string; rowCount: number }[]> {
    const db = dbService.getDb();
    const tables = db.all(sql`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE 'sqlite_%' 
      AND name NOT LIKE '__drizzle_%'
      ORDER BY name ASC
    `) as { name: string }[];

    return tables.map((t) => {
      // Need to execute raw string dynamically
      const countRes = db.all(sql.raw(`SELECT COUNT(*) as c FROM "${t.name}"`)) as { c: number }[];
      return {
        name: t.name,
        rowCount: countRes[0]?.c || 0,
      };
    });
  }

  public async getTableSchema(tableName: string): Promise<Record<string, unknown>[]> {
    const db = dbService.getDb();
    // PRAGMA table_info is safe enough with parameter if we format it
    return db.all(sql.raw(`PRAGMA table_info("${tableName.replace(/"/g, '""')}")`)) as Record<
      string,
      unknown
    >[];
  }

  public async getIndexes(tableName: string): Promise<Record<string, unknown>[]> {
    const db = dbService.getDb();
    return db.all(sql.raw(`PRAGMA index_list("${tableName.replace(/"/g, '""')}")`)) as Record<
      string,
      unknown
    >[];
  }

  public async getForeignKeys(tableName: string): Promise<Record<string, unknown>[]> {
    const db = dbService.getDb();
    return db.all(sql.raw(`PRAGMA foreign_key_list("${tableName.replace(/"/g, '""')}")`)) as Record<
      string,
      unknown
    >[];
  }

  public async getAllRows(
    tableName: string,
    _filters: string = '',
  ): Promise<Record<string, unknown>[]> {
    const db = dbService.getDb();
    const safeTable = tableName.replace(/"/g, '""');

    const rawRows = db.all(sql.raw(`SELECT * FROM "${safeTable}"`)) as Record<string, unknown>[];

    // Optional: apply badge augmentation if necessary, but for exports raw data is often better.
    // However, to keep it consistent with UI, let's augment it if needed, or just return raw.
    // We'll just return raw for export.
    return rawRows;
  }

  public async getRows(
    tableName: string,
    page: number = 1,
    pageSize: number = 50,
    _filters: string = '',
  ): Promise<{ rows: Record<string, unknown>[]; total: number }> {
    const db = dbService.getDb();
    const safeTable = tableName.replace(/"/g, '""');

    // Total
    const countRes = db.all(sql.raw(`SELECT COUNT(*) as c FROM "${safeTable}"`)) as { c: number }[];
    const total = countRes[0]?.c || 0;

    // Rows
    const offset = (page - 1) * pageSize;
    const rawRows = db.all(
      sql.raw(`SELECT * FROM "${safeTable}" LIMIT ${pageSize} OFFSET ${offset}`),
    ) as Record<string, unknown>[];

    // Augment with badges if available
    const rows = await Promise.all(
      rawRows.map(async (row) => {
        const badges = await inspectorRegistry.getBadges(tableName, row);
        if (badges.length > 0) {
          return { ...row, _badges: badges };
        }
        return row;
      }),
    );

    return { rows, total };
  }

  public async executeReadOnlyQuery(
    rawSql: string,
  ): Promise<{ rows: Record<string, unknown>[]; timeMs: number }> {
    const start = performance.now();
    const validSql = QueryValidator.validate(rawSql);

    const db = dbService.getDb();
    const result = db.all(sql.raw(validSql)) as Record<string, unknown>[];

    const end = performance.now();
    return {
      rows: result,
      timeMs: end - start,
    };
  }

  public async getRelations(
    tableName: string,
    row: Record<string, unknown>,
  ): Promise<InspectorRelation[]> {
    return inspectorRegistry.getRelations(tableName, row);
  }
}

export const databaseExplorerService = new DatabaseExplorerService();
