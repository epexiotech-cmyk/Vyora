import { ProductDto, CreateProductInput } from '@vyora/types';

import { ProductRepository } from '../repositories';

export class ProductService {
  private productRepo = new ProductRepository();

  public async getAllProducts(): Promise<ProductDto[]> {
    return await this.productRepo.getAll();
  }

  public async createProduct(data: CreateProductInput): Promise<ProductDto> {
    return await this.productRepo.create({
      companyId: data.companyId,
      name: data.name,
      sku: data.sku,
      hsnCode: data.hsnCode,
      unitId: data.unitId,
      taxId: data.taxId,
      salePrice: data.salePrice || 0,
      purchasePrice: data.purchasePrice || 0,
      stock: data.stock || 0,
    });
  }
}

export const productService = new ProductService();
