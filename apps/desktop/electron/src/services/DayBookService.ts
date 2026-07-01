import { DayBookReportDto, DayBookVoucherDto, JournalQueryFilter } from '@vyora/types';

import { journalQueryService } from './JournalQueryService';

export class DayBookService {
  /**
   * Generates a Day Book report by fetching all relevant journal entries
   * and orchestrating them into voucher-centric groupings.
   * Maintains strict chronological order and does NOT perform accounting math.
   */
  public async getDayBook(filter: JournalQueryFilter): Promise<DayBookReportDto> {
    // 1. Fetch flat, chronologically ordered journal entries from the query service
    const entries = await journalQueryService.getJournalEntries(filter);

    // 2. Orchestrate into voucher-centric structures
    const voucherMap = new Map<string, DayBookVoucherDto>();
    const orderedVouchers: DayBookVoucherDto[] = [];

    for (const entry of entries) {
      if (!voucherMap.has(entry.voucherId)) {
        const newVoucher: DayBookVoucherDto = {
          voucherId: entry.voucherId,
          voucherNumber: entry.voucherNumber,
          voucherDate: entry.voucherDate,
          voucherType: entry.voucherType,
          entries: [],
        };
        voucherMap.set(entry.voucherId, newVoucher);
        orderedVouchers.push(newVoucher);
      }

      voucherMap.get(entry.voucherId)!.entries.push(entry);
    }

    return {
      companyId: filter.companyId,
      financialYearId: filter.financialYearId,
      startDate: filter.startDate,
      endDate: filter.endDate,
      vouchers: orderedVouchers,
    };
  }
}

export const dayBookService = new DayBookService();
