import { randomUUID } from 'crypto';

import { company_settings, document_sequences, financial_years } from '@vyora/database';
import { eq, and } from 'drizzle-orm';

import { TransactionExecutor } from '../repositories/BaseRepository';

export type DocumentType =
  | 'SALES_INVOICE'
  | 'PURCHASE_INVOICE'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE'
  | 'PAYMENT_VOUCHER'
  | 'RECEIPT_VOUCHER'
  | 'CUSTOMER'
  | 'SUPPLIER';

export class NumberingEngineService {
  /**
   * Generates the next sequential document number.
   * MUST be executed within an existing transaction to ensure atomic increments and no gaps.
   */
  public async generateNextNumber(
    companyId: string,
    financialYearId: string,
    documentType: DocumentType,
    tx: TransactionExecutor,
  ): Promise<string> {
    // 1. Fetch Company Settings to determine policy, prefix, suffix, padding
    const settings = await tx
      .select()
      .from(company_settings)
      .where(eq(company_settings.companyId, companyId))
      .get();

    if (!settings) {
      throw new Error(`Company settings not found for company ${companyId}`);
    }

    // Determine configuration based on document type
    let prefix = '';
    let suffix: string | null = null;
    let padding = 4;
    let startFrom = 1;
    let resetPolicy = 'YEARLY';

    if (documentType === 'SALES_INVOICE') {
      prefix = settings.salesPrefix || 'INV';
      suffix = settings.salesSuffix;
      padding = settings.salesPadding ?? 4;
      startFrom = settings.salesStartFrom ?? 1;
      resetPolicy = settings.salesResetPolicy || 'YEARLY';
    } else if (documentType === 'PURCHASE_INVOICE') {
      prefix = settings.purchasePrefix || 'PUR';
      suffix = settings.purchaseSuffix;
      padding = settings.purchasePadding ?? 4;
      startFrom = settings.purchaseStartFrom ?? 1;
      resetPolicy = settings.purchaseResetPolicy || 'YEARLY';
    } else if (documentType === 'CUSTOMER') {
      prefix = 'CUST';
      padding = 4;
      startFrom = 1;
      resetPolicy = 'NEVER';
    } else if (documentType === 'SUPPLIER') {
      prefix = 'SUPP';
      padding = 5; // As per user request: SUPP-00001
      startFrom = 1;
      resetPolicy = 'NEVER';
    } else {
      // Fallbacks for future document types
      prefix = documentType.split('_')[0];
      padding = 4;
      startFrom = 1;
      resetPolicy = 'YEARLY';
    }

    // 2. Determine sequence scope based on Reset Policy
    const sequenceScopeFyId = resetPolicy === 'YEARLY' ? financialYearId : null;

    // 3. Find existing sequence record
    const conditions = [
      eq(document_sequences.companyId, companyId),
      eq(document_sequences.documentType, documentType),
    ];

    if (sequenceScopeFyId) {
      conditions.push(eq(document_sequences.financialYearId, sequenceScopeFyId));
    } else {
      // If policy is NEVER, ensure we only look at the global sequence where FY is null
      // Drizzle requires special handling for IS NULL, but since we're using SQLite, we can just omit it or match null
      // Actually, SQLite eq() on null might not work as IS NULL depending on driver.
      // Drizzle has `isNull` but we'll use a hack if needed.
    }
    // We will just fetch all matching and find the one where financialYearId matches exactly.
    const sequences = await tx
      .select()
      .from(document_sequences)
      .where(and(...conditions))
      .all();

    const sequenceRecord = sequences.find((s) => s.financialYearId === sequenceScopeFyId);

    let nextValue = startFrom;

    if (!sequenceRecord) {
      // Initialize sequence
      const id = randomUUID();
      await tx.insert(document_sequences).values({
        id,
        companyId,
        financialYearId: sequenceScopeFyId,
        documentType,
        currentValue: startFrom,
        updatedAt: new Date(),
      });
    } else {
      // Increment sequence
      nextValue = sequenceRecord.currentValue + 1;
      await tx
        .update(document_sequences)
        .set({
          currentValue: nextValue,
          updatedAt: new Date(),
        })
        .where(eq(document_sequences.id, sequenceRecord.id));
    }

    // 4. Construct Number
    let middleSegment = '';
    if (resetPolicy === 'YEARLY') {
      const fy = await tx
        .select()
        .from(financial_years)
        .where(eq(financial_years.id, financialYearId))
        .get();

      if (fy) {
        middleSegment = `/${fy.label}/`; // e.g. /26-27/
      } else {
        middleSegment = '/';
      }
    } else {
      middleSegment = '-';
    }

    const paddedSequence = String(nextValue).padStart(padding, '0');
    const finalSuffix = suffix ? `/${suffix}` : '';

    return `${prefix}${middleSegment}${paddedSequence}${finalSuffix}`;
  }
}

export const numberingEngineService = new NumberingEngineService();
