import { randomUUID } from 'crypto';

import { document_numbering_configs, document_numbering_sequences } from '@vyora/database';
import { DocumentType, DocumentNumberingConfigDto } from '@vyora/types';
import { eq, and, isNull } from 'drizzle-orm';

import { BaseRepository, TransactionExecutor } from './BaseRepository';

export class DocumentNumberingRepository extends BaseRepository {
  public getConfigSync(
    companyId: string,
    documentType: DocumentType,
    tx: TransactionExecutor,
  ): DocumentNumberingConfigDto | null {
    const config = tx
      .select()
      .from(document_numbering_configs)
      .where(
        and(
          eq(document_numbering_configs.companyId, companyId),
          eq(document_numbering_configs.documentType, documentType),
        ),
      )
      .get();

    if (!config) return null;
    return {
      documentType: config.documentType as DocumentType,
      prefix: config.prefix,
      formatTemplate: config.formatTemplate,
      fyFormat: config.fyFormat as import('@vyora/types').FyFormat,
      startingNumber: config.startingNumber,
      zeroPadding: config.zeroPadding,
      resetYearly: config.resetYearly,
    };
  }

  public saveConfigSync(
    companyId: string,
    configDto: DocumentNumberingConfigDto,
    tx: TransactionExecutor,
  ): void {
    const existing = tx
      .select()
      .from(document_numbering_configs)
      .where(
        and(
          eq(document_numbering_configs.companyId, companyId),
          eq(document_numbering_configs.documentType, configDto.documentType),
        ),
      )
      .get();

    const now = new Date();

    if (existing) {
      tx.update(document_numbering_configs)
        .set({
          prefix: configDto.prefix,
          formatTemplate: configDto.formatTemplate,
          fyFormat: configDto.fyFormat,
          startingNumber: configDto.startingNumber,
          zeroPadding: configDto.zeroPadding,
          resetYearly: configDto.resetYearly,
          updatedAt: now,
        })
        .where(eq(document_numbering_configs.id, existing.id))
        .run();
    } else {
      tx.insert(document_numbering_configs)
        .values({
          id: randomUUID(),
          companyId,
          documentType: configDto.documentType,
          prefix: configDto.prefix,
          formatTemplate: configDto.formatTemplate,
          fyFormat: configDto.fyFormat,
          startingNumber: configDto.startingNumber,
          zeroPadding: configDto.zeroPadding,
          resetYearly: configDto.resetYearly,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  }

  public incrementAndGetSequenceSync(
    companyId: string,
    documentType: DocumentType,
    financialYearId: string | null,
    tx: TransactionExecutor,
    startingNumber: number,
  ): number {
    const fyCondition = financialYearId
      ? eq(document_numbering_sequences.financialYearId, financialYearId)
      : isNull(document_numbering_sequences.financialYearId);

    const sequence = tx
      .select()
      .from(document_numbering_sequences)
      .where(
        and(
          eq(document_numbering_sequences.companyId, companyId),
          eq(document_numbering_sequences.documentType, documentType),
          fyCondition,
        ),
      )
      .get();

    const now = new Date();

    if (sequence) {
      const nextVal = sequence.currentSequence + 1;
      tx.update(document_numbering_sequences)
        .set({
          currentSequence: nextVal,
          updatedAt: now,
        })
        .where(eq(document_numbering_sequences.id, sequence.id))
        .run();
      return nextVal;
    } else {
      // First sequence for this FY (or globally if no FY reset)
      // We start at startingNumber.
      tx.insert(document_numbering_sequences)
        .values({
          id: randomUUID(),
          companyId,
          documentType,
          financialYearId,
          currentSequence: startingNumber,
          updatedAt: now,
        })
        .run();
      return startingNumber;
    }
  }

  public async getConfig(
    companyId: string,
    documentType: DocumentType,
    tx?: import('./BaseRepository').DbTransaction,
  ): Promise<DocumentNumberingConfigDto | null> {
    const executor = tx || this.db;
    const config = await executor
      .select()
      .from(document_numbering_configs)
      .where(
        and(
          eq(document_numbering_configs.companyId, companyId),
          eq(document_numbering_configs.documentType, documentType),
        ),
      )
      .get();

    if (!config) return null;

    return {
      documentType: config.documentType as DocumentType,
      prefix: config.prefix,
      formatTemplate: config.formatTemplate,
      fyFormat: config.fyFormat as import('@vyora/types').FyFormat,
      startingNumber: config.startingNumber,
      zeroPadding: config.zeroPadding,
      resetYearly: config.resetYearly,
    };
  }

  public async saveConfig(
    companyId: string,
    configDto: DocumentNumberingConfigDto,
    tx?: import('./BaseRepository').DbTransaction,
  ): Promise<void> {
    const executor = tx || this.db;
    const existing = await executor
      .select()
      .from(document_numbering_configs)
      .where(
        and(
          eq(document_numbering_configs.companyId, companyId),
          eq(document_numbering_configs.documentType, configDto.documentType),
        ),
      )
      .get();

    const now = new Date();

    if (existing) {
      await executor
        .update(document_numbering_configs)
        .set({
          prefix: configDto.prefix,
          formatTemplate: configDto.formatTemplate,
          fyFormat: configDto.fyFormat,
          startingNumber: configDto.startingNumber,
          zeroPadding: configDto.zeroPadding,
          resetYearly: configDto.resetYearly,
          updatedAt: now,
        })
        .where(eq(document_numbering_configs.id, existing.id));
    } else {
      await executor.insert(document_numbering_configs).values({
        id: randomUUID(),
        companyId,
        documentType: configDto.documentType,
        prefix: configDto.prefix,
        formatTemplate: configDto.formatTemplate,
        fyFormat: configDto.fyFormat,
        startingNumber: configDto.startingNumber,
        zeroPadding: configDto.zeroPadding,
        resetYearly: configDto.resetYearly,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  public async getAllConfigs(
    companyId: string,
    tx?: import('./BaseRepository').DbTransaction,
  ): Promise<DocumentNumberingConfigDto[]> {
    const executor = tx || this.db;
    const configs = await executor
      .select()
      .from(document_numbering_configs)
      .where(eq(document_numbering_configs.companyId, companyId));

    return configs.map((config) => ({
      documentType: config.documentType as DocumentType,
      prefix: config.prefix,
      formatTemplate: config.formatTemplate,
      fyFormat: config.fyFormat as import('@vyora/types').FyFormat,
      startingNumber: config.startingNumber,
      zeroPadding: config.zeroPadding,
      resetYearly: config.resetYearly,
    }));
  }
}
