import { attendance_records } from '@vyora/database';
import type { AttendanceRecord } from '@vyora/database';
import { MarkAttendanceInput, SearchAttendanceOptions } from '@vyora/types';
import { and, desc, eq, sql } from 'drizzle-orm';

import { BaseRepository } from './BaseRepository';

export class AttendanceRepository extends BaseRepository {
  async getById(id: string, companyId: string): Promise<AttendanceRecord | null> {
    const [record] = await this.db
      .select()
      .from(attendance_records)
      .where(and(eq(attendance_records.id, id), eq(attendance_records.companyId, companyId)))
      .limit(1);

    return record || null;
  }

  async search(
    companyId: string,
    options: SearchAttendanceOptions,
  ): Promise<{ data: AttendanceRecord[]; total: number }> {
    const conditions = [eq(attendance_records.companyId, companyId)];

    if (options.employeeId) {
      conditions.push(eq(attendance_records.employeeId, options.employeeId));
    }

    if (options.fromDate) {
      conditions.push(sql`${attendance_records.attendanceDate} >= ${options.fromDate.getTime()}`);
    }

    if (options.toDate) {
      // Inclusive to the end of the day if it's just a date
      conditions.push(sql`${attendance_records.attendanceDate} <= ${options.toDate.getTime()}`);
    }

    if (options.status) {
      conditions.push(eq(attendance_records.status, options.status));
    }

    const whereClause = and(...conditions);

    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(attendance_records)
      .where(whereClause);

    const data = await this.db
      .select()
      .from(attendance_records)
      .where(whereClause)
      .orderBy(desc(attendance_records.attendanceDate))
      .limit(options.limit || 50)
      .offset(options.offset || 0);

    return {
      data,
      total: countResult?.count || 0,
    };
  }

  async mark(companyId: string, input: MarkAttendanceInput): Promise<AttendanceRecord> {
    const id = crypto.randomUUID();
    const now = new Date();

    const [record] = await this.db
      .insert(attendance_records)
      .values({
        id,
        companyId,
        employeeId: input.employeeId,
        attendanceDate: input.attendanceDate,
        status: input.status,
        remarks: input.remarks || null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          attendance_records.companyId,
          attendance_records.employeeId,
          attendance_records.attendanceDate,
        ],
        set: {
          status: input.status,
          remarks: input.remarks || null,
          updatedAt: now,
        },
      })
      .returning();

    return record;
  }

  async clear(companyId: string, employeeId: string, attendanceDate: Date): Promise<void> {
    await this.db
      .delete(attendance_records)
      .where(
        and(
          eq(attendance_records.companyId, companyId),
          eq(attendance_records.employeeId, employeeId),
          eq(attendance_records.attendanceDate, attendanceDate),
        ),
      );
  }
}

export const attendanceRepository = new AttendanceRepository();
