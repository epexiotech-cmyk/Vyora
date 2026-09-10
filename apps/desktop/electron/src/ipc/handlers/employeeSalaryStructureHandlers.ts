import { ApiResponse, CreateSalaryStructureInput, SalaryStructureDto } from '@vyora/types';
import { ipcMain } from 'electron';

import { employeeSalaryStructureService } from '../../services/EmployeeSalaryStructureService';

export function registerEmployeeSalaryStructureHandlers(): void {
  ipcMain.handle(
    'employee-salary-structures:getByEmployeeId',
    async (_, employeeId: string): Promise<ApiResponse<SalaryStructureDto[]>> => {
      try {
        const data = await employeeSalaryStructureService.getByEmployeeId(employeeId);
        return { success: true, data };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle(
    'employee-salary-structures:getById',
    async (_, id: string): Promise<ApiResponse<SalaryStructureDto | null>> => {
      try {
        const data = await employeeSalaryStructureService.getById(id);
        return { success: true, data };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );

  ipcMain.handle(
    'employee-salary-structures:create',
    async (_, input: CreateSalaryStructureInput): Promise<ApiResponse<SalaryStructureDto>> => {
      try {
        const data = await employeeSalaryStructureService.create(input);
        return { success: true, data };
      } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
      }
    },
  );
}
