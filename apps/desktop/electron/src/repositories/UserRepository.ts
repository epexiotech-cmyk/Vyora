import { users, user_settings, InsertUser, InsertUserSetting } from '@vyora/database';
import { eq } from 'drizzle-orm';

import { dbService } from '../services/database/DatabaseService';

export class UserRepository {
  public async getAdminCount(): Promise<number> {
    const db = dbService.getDb();
    const result = await db.select().from(users).where(eq(users.role, 'admin'));
    return result.length;
  }

  public async getByUsername(username: string) {
    const db = dbService.getDb();
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  }

  public async getById(id: string) {
    const db = dbService.getDb();
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  public async create(user: InsertUser, tx?: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (tx as any) || dbService.getDb();
    await db.insert(users).values(user);
    return user.id;
  }

  public async update(id: string, data: Partial<InsertUser>, tx?: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (tx as any) || dbService.getDb();
    await db.update(users).set(data).where(eq(users.id, id));
  }

  public async getUserSettings(userId: string) {
    const db = dbService.getDb();
    const result = await db
      .select()
      .from(user_settings)
      .where(eq(user_settings.userId, userId))
      .limit(1);
    return result[0] || null;
  }

  public async updateUserSettings(userId: string, data: Partial<InsertUserSetting>, tx?: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (tx as any) || dbService.getDb();
    const existing = await this.getUserSettings(userId);

    if (existing) {
      await db.update(user_settings).set(data).where(eq(user_settings.userId, userId));
    } else {
      const id = crypto.randomUUID();
      await db.insert(user_settings).values({
        id,
        userId,
        ...data,
      });
    }
  }
}
