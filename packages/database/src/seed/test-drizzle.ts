import { randomUUID } from 'crypto';

/* eslint-disable no-console */
import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

const testTable = sqliteTable('test_table', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

const sqlite = new Database(':memory:');
const db = drizzle(sqlite);

db.run(sql`CREATE TABLE test_table (id TEXT PRIMARY KEY, name TEXT)`);

async function test() {
  const id1 = randomUUID();
  console.log('Inserting with .run()');
  db.insert(testTable).values({ id: id1, name: 'Test 1' }).run();

  const id2 = randomUUID();
  console.log('Inserting with await but no .run()');
  await db.insert(testTable).values({ id: id2, name: 'Test 2' });

  const all = db.select().from(testTable).all();
  console.log('All records:', all);
}

test().catch(console.error);
