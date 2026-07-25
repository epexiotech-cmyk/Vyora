import {
  ProductDto,
  CreateProductInput,
  UpdateProductInput,
  SearchProductsOptions,
  ProductListDto,
  createProductSchema,
  updateProductSchema,
} from '@vyora/types';
import { DocumentType } from '@vyora/types';
import { normalizeName } from '@vyora/utils';

import { UnitRepository, TaxRepository, ProductRepository } from '../repositories';

import { companyContextService } from './CompanyContextService';
import { documentNumberingService } from './DocumentNumberingService';
import { financialYearContextService } from './FinancialYearContextService';
import { inventoryEngine } from './InventoryEngine';

export class ProductService {
  private productRepo = new ProductRepository();
  private unitRepo = new UnitRepository();
  private taxRepo = new TaxRepository();

  public async searchProducts(options: SearchProductsOptions): Promise<ProductListDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');
    return await this.productRepo.search(companyId, options);
  }

  public async getProductById(id: string): Promise<ProductDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');
    return await this.productRepo.getById(id, companyId);
  }

  public async createProduct(data: CreateProductInput): Promise<ProductDto> {
    const validatedData = createProductSchema.parse(data);
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');

    const normalizedName = normalizeName(validatedData.name);
    validatedData.name = normalizedName;

    const existing = await this.productRepo.getByName(normalizedName, companyId);
    if (existing) throw new Error('An item with this name already exists');

    const unit = await this.unitRepo.getById(validatedData.unitId, companyId);
    if (!unit) throw new Error('Invalid Unit ID: Unit does not exist or belong to this company');

    const tax = await this.taxRepo.getById(validatedData.taxId, companyId);
    if (!tax) throw new Error('Invalid Tax ID: Tax does not exist or belong to this company');

    const activeFy = financialYearContextService.getActiveFinancialYear();

    return this.productRepo.transaction((tx) => {
      const sku = documentNumberingService.generateNextNumberSync(
        companyId,
        DocumentType.ITEM,
        '',
        tx,
      );

      const createdProduct = this.productRepo.createSync(
        companyId,
        {
          ...validatedData,
          sku,
        },
        tx,
      );

      if (
        validatedData.itemType === 'INVENTORY_ITEM' &&
        validatedData.stock &&
        validatedData.stock > 0
      ) {
        if (!activeFy) throw new Error('No active financial year context found for opening stock');

        inventoryEngine.postInboundSync(
          {
            companyId,
            financialYearId: activeFy.id,
            productId: createdProduct.id,
            movementType: 'OPENING_STOCK',
            referenceType: 'PRODUCT_CREATION',
            referenceId: createdProduct.id,
            quantityIn: validatedData.stock,
            quantityOut: 0,
            rate: validatedData.openingValuationRate || 0,
            movementDate: new Date(),
            remarks: 'Opening Stock',
          },
          tx,
        );
      }

      return createdProduct;
    });
  }

  public async updateProduct(id: string, data: UpdateProductInput): Promise<ProductDto> {
    const validatedData = updateProductSchema.parse(data);
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');

    if (validatedData.name) {
      const normalizedName = normalizeName(validatedData.name);
      validatedData.name = normalizedName;

      const existing = await this.productRepo.getByName(normalizedName, companyId);
      if (existing && existing.id !== id) throw new Error('An item with this name already exists');
    }

    if (validatedData.unitId) {
      const unit = await this.unitRepo.getById(validatedData.unitId, companyId);
      if (!unit) throw new Error('Invalid Unit ID: Unit does not exist or belong to this company');
    }

    if (validatedData.taxId) {
      const tax = await this.taxRepo.getById(validatedData.taxId, companyId);
      if (!tax) throw new Error('Invalid Tax ID: Tax does not exist or belong to this company');
    }

    // Opening stock adjustments on update are not handled here - should be done via separate ledger transactions
    // If the user tries to update stock, we should probably ignore it or throw an error. For now, ProductRepo update ignores stock if we don't pass it, but updateProductSchema allows it. Let's just pass it to repo which doesn't touch stock balances for update (well, wait, does ProductRepo update stock? In update(), we spread data, so it would update stock column. But stock should be managed by ledger). Let's delete stock from validatedData to prevent manipulation.
    delete validatedData.stock;
    delete validatedData.openingValuationRate;

    return this.productRepo.transaction((tx) => {
      return this.productRepo.updateSync(id, companyId, validatedData, tx);
    });
  }

  public async deactivateProduct(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');

    return await this.productRepo.deactivate(id, companyId);
  }
}

export const productService = new ProductService();
