import { randomUUID } from 'crypto';

import {
  companies,
  company_signatures,
  Company,
  InsertCompany,
  sales_invoices,
} from '@vyora/database';
import { CompanyDto, CompanySignatureDto } from '@vyora/types';
import { eq, isNull } from 'drizzle-orm';

import { BaseRepository, DbTransaction } from './BaseRepository';

function mapToDto(entity: Company, signatures: CompanySignatureDto[] = []): CompanyDto {
  const defaultSignature = signatures.find((s) => s.isDefault);

  return {
    id: entity.id,
    legalName: entity.legalName,
    tradeName: entity.tradeName,
    gstin: entity.gstin,
    pan: entity.pan,
    constitutionType: entity.constitutionType,
    businessType: entity.businessType,
    addressLine1: entity.addressLine1,
    addressLine2: entity.addressLine2,
    city: entity.city,
    district: entity.district,
    stateCode: entity.stateCode,
    gstStateId: entity.gstStateId,
    countryCode: entity.countryCode,
    pincode: entity.pincode,
    email: entity.email,
    mobile: entity.mobile,
    telephone: entity.telephone,
    website: entity.website,
    logoPath: entity.logoPath,
    signaturePath: defaultSignature ? defaultSignature.filePath : entity.signaturePath,
    signatures,
    defaultUpiId: entity.defaultUpiId,
    upiPayeeName: entity.upiPayeeName,
    showQrOnInvoice: entity.showQrOnInvoice,
    showBankDetailsOnInvoice: entity.showBankDetailsOnInvoice,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt,
  };
}

export class CompanyRepository extends BaseRepository {
  public async getFirst(tx?: DbTransaction): Promise<CompanyDto | undefined> {
    const executor = tx || this.db;
    const result = await executor.select().from(companies).get();
    if (!result) return undefined;
    const signatures = await this.getSignatures(result.id, tx);
    return mapToDto(result, signatures);
  }

  public async getById(id: string, tx?: DbTransaction): Promise<CompanyDto | undefined> {
    const executor = tx || this.db;
    const result = await executor.select().from(companies).where(eq(companies.id, id)).get();
    if (!result) return undefined;
    const signatures = await this.getSignatures(id, tx);
    return mapToDto(result, signatures);
  }

  public getByIdSync(id: string, tx: DbTransaction): CompanyDto | undefined {
    const result = tx.select().from(companies).where(eq(companies.id, id)).get();
    if (!result) return undefined;

    const sigRecords = tx
      .select()
      .from(company_signatures)
      .where(eq(company_signatures.companyId, id))
      .all();
    const signatures: CompanySignatureDto[] = sigRecords.map((s) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    }));

    return mapToDto(result, signatures);
  }

  public async getSignatures(
    companyId: string,
    tx?: DbTransaction,
  ): Promise<CompanySignatureDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(company_signatures)
      .where(eq(company_signatures.companyId, companyId))
      .all();

    return results.map((s) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    }));
  }

  public getSignaturesSync(companyId: string, tx: DbTransaction): CompanySignatureDto[] {
    const results = tx
      .select()
      .from(company_signatures)
      .where(eq(company_signatures.companyId, companyId))
      .all();

    return results.map((s) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    }));
  }

  public addSignatureSync(
    companyId: string,
    filePath: string,
    label: string,
    designation: string,
    isDefault: boolean,
  ): CompanySignatureDto {
    return this.transaction((tx) => {
      if (isDefault) {
        tx.update(company_signatures)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(company_signatures.companyId, companyId))
          .run();
      }

      const id = randomUUID();
      const now = new Date();

      tx.insert(company_signatures)
        .values({
          id,
          companyId,
          filePath,
          label,
          designation,
          isDefault,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      return {
        id,
        companyId,
        filePath,
        label,
        designation,
        isDefault,
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  public updateSignatureDesignationSync(
    companyId: string,
    signatureId: string,
    designation: string,
  ): void {
    this.transaction((tx) => {
      const target = tx
        .select()
        .from(company_signatures)
        .where(eq(company_signatures.id, signatureId))
        .get();
      if (!target || target.companyId !== companyId) {
        throw new Error("Signature not found or doesn't belong to this company");
      }

      tx.update(company_signatures)
        .set({ designation, updatedAt: new Date() })
        .where(eq(company_signatures.id, signatureId))
        .run();
    });
  }

  public setSignatureDefaultSync(companyId: string, signatureId: string): void {
    this.transaction((tx) => {
      const target = tx
        .select()
        .from(company_signatures)
        .where(eq(company_signatures.id, signatureId))
        .get();
      if (!target || target.companyId !== companyId) {
        throw new Error("Signature not found or doesn't belong to this company");
      }

      tx.update(company_signatures)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(company_signatures.companyId, companyId))
        .run();

      tx.update(company_signatures)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(company_signatures.id, signatureId))
        .run();
    });
  }

  public deleteSignatureSync(companyId: string, signatureId: string): void {
    this.transaction((tx) => {
      const target = tx
        .select()
        .from(company_signatures)
        .where(eq(company_signatures.id, signatureId))
        .get();
      if (!target || target.companyId !== companyId) {
        throw new Error("Signature not found or doesn't belong to this company");
      }

      const inUse = tx
        .select({ id: sales_invoices.id })
        .from(sales_invoices)
        .where(eq(sales_invoices.signatureId, signatureId))
        .limit(1)
        .all();

      if (inUse.length > 0) {
        throw new Error('Cannot delete signature because it is referenced by existing invoices.');
      }

      tx.delete(company_signatures).where(eq(company_signatures.id, signatureId)).run();

      if (target.isDefault) {
        const remaining = tx
          .select()
          .from(company_signatures)
          .where(eq(company_signatures.companyId, companyId))
          .all();
        if (remaining.length > 0) {
          tx.update(company_signatures)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(eq(company_signatures.id, remaining[0].id))
            .run();
        }
      }
    });
  }

  public async create(
    data: Omit<CompanyDto, 'id' | 'createdAt' | 'updatedAt'>,
    tx?: DbTransaction,
  ): Promise<CompanyDto> {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newCompany = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await executor.insert(companies).values(newCompany as InsertCompany);
    return (await this.getById(id, tx))!;
  }

  public createSync(
    data: Omit<CompanyDto, 'id' | 'createdAt' | 'updatedAt'>,
    tx?: DbTransaction,
  ): CompanyDto {
    const executor = tx || this.db;
    const id = randomUUID();
    const now = new Date();

    const newCompany = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    executor
      .insert(companies)
      .values(newCompany as InsertCompany)
      .run();
    return this.getByIdSync(id, executor as DbTransaction)!;
  }

  public async updateProfile(
    id: string,
    data: Partial<Omit<CompanyDto, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>,
    tx?: DbTransaction,
  ): Promise<CompanyDto | undefined> {
    const executor = tx || this.db;
    const now = new Date();

    // Do not spread signatures into updateData
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { showQrOnInvoice, showBankDetailsOnInvoice, signatures, ...restData } = data;

    const updateData = {
      ...restData,
      updatedAt: now,
      ...(showQrOnInvoice !== undefined ? { showQrOnInvoice: showQrOnInvoice ?? false } : {}),
      ...(showBankDetailsOnInvoice !== undefined
        ? { showBankDetailsOnInvoice: showBankDetailsOnInvoice ?? false }
        : {}),
    };

    await executor.update(companies).set(updateData).where(eq(companies.id, id));

    return this.getById(id, tx);
  }

  public async list(tx?: DbTransaction): Promise<CompanyDto[]> {
    const executor = tx || this.db;
    const results = await executor
      .select()
      .from(companies)
      .where(isNull(companies.deletedAt))
      .all();

    // Ideally this should batch fetch, but we'll fetch signatures for each for now
    const companiesWithSignatures = await Promise.all(
      results.map(async (company) => {
        const signatures = await this.getSignatures(company.id, tx);
        return mapToDto(company, signatures);
      }),
    );

    return companiesWithSignatures;
  }

  public async softDelete(id: string, tx?: DbTransaction): Promise<void> {
    const executor = tx || this.db;
    const now = new Date();
    await executor.update(companies).set({ deletedAt: now }).where(eq(companies.id, id));
  }
}

export const companyRepository = new CompanyRepository();
