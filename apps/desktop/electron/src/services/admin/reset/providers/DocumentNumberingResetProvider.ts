import { document_numbering_sequences } from '@vyora/database';
import { sql } from 'drizzle-orm';

import { DbTransaction } from '../../../../main/database/adapters/IDatabaseAdapter';
import { IResetProvider } from '../IResetProvider';

export class DocumentNumberingResetProvider implements IResetProvider {
  public getDomainName(): string {
    return 'Document Numbering';
  }

  public reset(tx: DbTransaction): Record<string, number> {
    const counts: Record<string, number> = {};

    counts.document_numbering_sequences =
      tx.get<{ count: number }>(sql`SELECT COUNT(*) as count FROM document_numbering_sequences`)
        ?.count || 0;
    tx.delete(document_numbering_sequences).run();

    return counts;
  }
}
