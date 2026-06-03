import { ProductDto, CreateProductInput, ApiResponse } from '@vyora/types';
import { ipcMain } from 'electron';

import { productService } from '../../services/ProductService';

export function registerProductHandlers() {
  ipcMain.handle(
    'db:products:getAll',
    async (_event, _args?: unknown): Promise<ApiResponse<ProductDto[]>> => {
      try {
        const result = await productService.getAllProducts();
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
}
