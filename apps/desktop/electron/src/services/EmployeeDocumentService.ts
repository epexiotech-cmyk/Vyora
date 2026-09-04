import * as path from 'path';

import {
  CreateEmployeeDocumentInput,
  UpdateEmployeeDocumentInput,
  EmployeeDocumentDto,
} from '@vyora/types';

import { EmployeeDocumentRepository } from '../repositories/EmployeeDocumentRepository';

import { authService } from './AuthService';
import { companyContextService } from './CompanyContextService';
import { fileSystemService } from './filesystem/FileSystemService';

class EmployeeDocumentService {
  private repo = new EmployeeDocumentRepository();

  public async getByEmployeeId(employeeId: string): Promise<EmployeeDocumentDto[]> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    return this.repo.getByEmployeeId(employeeId, companyId);
  }

  public async getById(id: string): Promise<EmployeeDocumentDto | null> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    return this.repo.getById(id, companyId);
  }

  public async create(
    employeeId: string,
    data: CreateEmployeeDocumentInput,
  ): Promise<EmployeeDocumentDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    return this.repo.create(employeeId, companyId, data);
  }

  public async uploadDocument(
    employeeId: string,
    data: Omit<CreateEmployeeDocumentInput, 'filePath'>,
    filename: string,
    buffer: Buffer | ArrayBuffer,
  ): Promise<EmployeeDocumentDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    // Ensure filename is safe and unique
    const timestamp = Date.now();
    const ext = filename.split('.').pop()?.toLowerCase();
    const safeFilename = ext ? `doc-${timestamp}.${ext}` : `doc-${timestamp}`;

    const savedPath = fileSystemService.saveEmployeeDocument(
      companyId,
      employeeId,
      safeFilename,
      nodeBuffer,
    );

    const fullData: CreateEmployeeDocumentInput = {
      ...data,
      filePath: savedPath,
    };

    return this.repo.create(employeeId, companyId, fullData);
  }

  public async update(id: string, data: UpdateEmployeeDocumentInput): Promise<EmployeeDocumentDto> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    return this.repo.update(id, companyId, data);
  }

  public async deactivate(id: string): Promise<void> {
    const companyId = companyContextService.getActiveCompany();
    if (!companyId) throw new Error('No active company');
    this.checkAdminRole();

    const existing = await this.repo.getById(id, companyId);
    if (existing && existing.filePath) {
      const filename = path.basename(existing.filePath);
      fileSystemService.deleteEmployeeDocument(companyId, existing.employeeId, filename);
    }

    await this.repo.deactivate(id, companyId);
  }

  private checkAdminRole() {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Admin role required');
    }
  }
}

export const employeeDocumentService = new EmployeeDocumentService();
