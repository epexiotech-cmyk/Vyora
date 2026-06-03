import { Product, InsertProduct } from '@vyora/types';

import { ProductRepository } from '../repositories';

export class ProductService {
  private productRepo = new ProductRepository();

  public async getAllProducts(): Promise<Product[]> {
    return await this.productRepo.getAll();
  }

  public async createProduct(data: Omit<InsertProduct, 'id' | 'createdAt'>): Promise<Product> {
    return await this.productRepo.create(data);
  }
}

export const productService = new ProductService();
