import {
  ProductDto,
  CreateProductInput,
  UpdateProductInput,
  SearchProductsOptions,
  ApiResponse,
  ProductListDto,
} from '@vyora/types';
import { ipcMain } from 'electron';

import { productService } from '../../services/ProductService';

export function registerProductHandlers() {
  ipcMain.handle(
    'db:products:getAll',
    async (_event, _args?: unknown): Promise<ApiResponse<ProductDto[]>> => {
      try {
        const result = await productService.searchProducts({});
        return { success: true, data: result.data };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:products:search',
    async (_event, options: SearchProductsOptions): Promise<ApiResponse<ProductListDto>> => {
      try {
        const result = await productService.searchProducts(options);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:products:getById',
    async (_event, id: string): Promise<ApiResponse<ProductDto | null>> => {
      try {
        const result = await productService.getProductById(id);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:products:create',
    async (_event, data: CreateProductInput): Promise<ApiResponse<ProductDto>> => {
      try {
        const result = await productService.createProduct(data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'db:products:update',
    async (_event, id: string, data: UpdateProductInput): Promise<ApiResponse<ProductDto>> => {
      try {
        const result = await productService.updateProduct(id, data);
        return { success: true, data: result };
      } catch (err: unknown) {
        return { success: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('db:products:delete', async (_event, id: string): Promise<ApiResponse<void>> => {
    try {
      await productService.deactivateProduct(id);
      return { success: true, data: undefined };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  });
}
