import { sessions, InsertSession } from '@vyora/database';
import { eq, lte } from 'drizzle-orm';

import { dbService } from '../services/database/DatabaseService';

export class AuthRepository {
  public async createSession(session: InsertSession, tx?: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (tx as any) || dbService.getDb();
    await db.insert(sessions).values(session);
    return session.id;
  }

  public async getSessionByHash(tokenHash: string) {
    const db = dbService.getDb();
    const result = await db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);
    return result[0] || null;
  }

  public async updateSession(id: string, data: Partial<InsertSession>, tx?: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (tx as any) || dbService.getDb();
    await db.update(sessions).set(data).where(eq(sessions.id, id));
  }

  public async deleteSession(id: string, tx?: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (tx as any) || dbService.getDb();
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  public async revokeAllUserSessions(userId: string, tx?: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (tx as any) || dbService.getDb();
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, userId));
  }

  public async cleanupExpiredSessions() {
    const db = dbService.getDb();
    await db.delete(sessions).where(lte(sessions.expiresAt, new Date()));
  }
}
