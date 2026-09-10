import { randomUUID } from 'crypto';

import { LeaveRequest, leave_requests, InsertLeaveRequest } from '@vyora/database';
import { SearchLeaveRequestsOptions } from '@vyora/types';
import { and, eq, like, desc, asc, SQL, or, sql } from 'drizzle-orm';

import { BaseRepository } from './BaseRepository';

export class LeaveRequestRepository extends BaseRepository {
  async create(
    data: Omit<InsertLeaveRequest, 'id' | 'createdAt' | 'updatedAt' | 'companyId' | 'status'> & {
      companyId: string;
    },
  ): Promise<LeaveRequest> {
    const id = randomUUID();
    const now = new Date();

    const insertData: InsertLeaveRequest = {
      ...data,
      id,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
      syncVersion: 1,
    };

    const [result] = await this.db.insert(leave_requests).values(insertData).returning();
    return result;
  }

  async update(
    id: string,
    companyId: string,
    data: Partial<
      Omit<InsertLeaveRequest, 'id' | 'createdAt' | 'updatedAt' | 'companyId' | 'status'>
    >,
  ): Promise<LeaveRequest> {
    const [result] = await this.db
      .update(leave_requests)
      .set({
        ...data,
        updatedAt: new Date(),
        syncVersion: sql`${leave_requests.syncVersion} + 1`,
      })
      .where(and(eq(leave_requests.id, id), eq(leave_requests.companyId, companyId)))
      .returning();

    if (!result) {
      throw new Error('Leave request not found');
    }

    return result;
  }

  async search(
    companyId: string,
    options: SearchLeaveRequestsOptions,
  ): Promise<{ data: LeaveRequest[]; total: number }> {
    const conditions: SQL[] = [eq(leave_requests.companyId, companyId)];

    if (options.employeeId) {
      conditions.push(eq(leave_requests.employeeId, options.employeeId));
    }

    if (options.leaveTypeId) {
      conditions.push(eq(leave_requests.leaveTypeId, options.leaveTypeId));
    }

    if (options.financialYearId) {
      conditions.push(eq(leave_requests.financialYearId, options.financialYearId));
    }

    if (options.status) {
      conditions.push(eq(leave_requests.status, options.status));
    }

    if (options.searchTerm) {
      conditions.push(like(leave_requests.reason, `%${options.searchTerm}%`));
    }

    const whereClause = and(...conditions);

    const [{ count }] = await this.db
      .select({ count: sql<number>`cast(count(${leave_requests.id}) as integer)` })
      .from(leave_requests)
      .where(whereClause);

    const query = this.db.select().from(leave_requests).where(whereClause);

    if (options.sortBy) {
      const orderFn = options.sortOrder === 'desc' ? desc : asc;
      // Map sort string to column
      const columnMap: Record<string, import('drizzle-orm').AnyColumn | import('drizzle-orm').SQL> =
        {
          fromDate: leave_requests.fromDate,
          toDate: leave_requests.toDate,
          status: leave_requests.status,
          createdAt: leave_requests.createdAt,
        };

      const orderCol = columnMap[options.sortBy] || leave_requests.createdAt;
      query.orderBy(orderFn(orderCol));
    } else {
      query.orderBy(desc(leave_requests.createdAt));
    }

    if (options.page && options.limit) {
      query.limit(options.limit).offset((options.page - 1) * options.limit);
    }

    const data = await query;
    return { data, total: count };
  }

  async findOverlappingRequests(
    companyId: string,
    employeeId: string,
    fromDate: Date,
    toDate: Date,
    excludeId?: string,
  ): Promise<LeaveRequest[]> {
    // Check if new range overlaps with any existing Pending or Approved request
    // Overlap condition: (new_start <= old_end) AND (new_end >= old_start)
    const conditions: SQL[] = [
      eq(leave_requests.companyId, companyId),
      eq(leave_requests.employeeId, employeeId),
      or(eq(leave_requests.status, 'Pending'), eq(leave_requests.status, 'Approved'))!,
      sql`${leave_requests.fromDate} <= ${toDate.getTime()}`,
      sql`${leave_requests.toDate} >= ${fromDate.getTime()}`,
    ];

    if (excludeId) {
      conditions.push(sql`${leave_requests.id} != ${excludeId}`);
    }

    const whereClause = and(...conditions);

    return this.db.select().from(leave_requests).where(whereClause);
  }

  async getById(id: string, companyId: string): Promise<LeaveRequest | undefined> {
    const record = await this.db
      .select()
      .from(leave_requests)
      .where(and(eq(leave_requests.id, id), eq(leave_requests.companyId, companyId)))
      .get();
    return record;
  }

  async softDelete(id: string, companyId: string): Promise<void> {
    await this.db
      .update(leave_requests)
      .set({
        deletedAt: new Date(),
        syncVersion: sql`${leave_requests.syncVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(leave_requests.id, id), eq(leave_requests.companyId, companyId)));
  }

  async transitionStatus(
    id: string,
    companyId: string,
    expectedStatus: string,
    newStatus: string,
    metadata: {
      approverId?: string | null;
      approverRemarks?: string | null;
      approvedAt?: Date | null;
    },
    tx?: import('./BaseRepository').TransactionExecutor,
  ): Promise<void> {
    const db = tx || this.db;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      status: newStatus,
      updatedAt: new Date(),
      syncVersion: sql`${leave_requests.syncVersion} + 1`,
    };

    if (metadata.approverId !== undefined) updateData.approverId = metadata.approverId;
    if (metadata.approverRemarks !== undefined)
      updateData.approverRemarks = metadata.approverRemarks;
    if (metadata.approvedAt !== undefined) updateData.approvedAt = metadata.approvedAt;

    const result = await db
      .update(leave_requests)
      .set(updateData)
      .where(
        and(
          eq(leave_requests.id, id),
          eq(leave_requests.companyId, companyId),
          eq(
            leave_requests.status,
            expectedStatus as 'Pending' | 'Approved' | 'Rejected' | 'Cancelled',
          ),
        ),
      )
      .run();

    if (result.changes === 0) {
      throw new Error(
        `Failed to transition status from ${expectedStatus} to ${newStatus}. The request may not exist or its status has already changed.`,
      );
    }
  }
}

export const leaveRequestRepository = new LeaveRequestRepository();
