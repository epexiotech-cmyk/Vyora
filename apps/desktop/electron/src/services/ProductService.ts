import {
  ProductDto,
  CreateProductInput,
  UpdateProductInput,
  SearchProductsOptions,
  ProductListDto,
  createProductSchema,
  updateProductSchema,
} from '@vyora/types';

import { ProductRepository } from '../repositories';

import { companyContextService } from './CompanyContextService';
import { numberingEngineService } from './NumberingEngineService';

export class ProductService {
  private productRepo = new ProductRepository();

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

    return this.productRepo.transaction((tx) => {
      const sku = numberingEngineService.generateNextNumberSync(companyId, '', 'ITEM', tx);

      return this.productRepo.createSync(
        companyId,
        {
          ...validatedData,
          sku,
        },
        tx,
      );
    });
  }

  public async updateProduct(id: string, data: UpdateProductInput): Promise<ProductDto> {
    const validatedData = updateProductSchema.parse(data);
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company context found');

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
