import { z } from 'zod';

export interface UnitDto {
  id: string;
  companyId: string;
  name: string;
  shortName: string;
  uqcCode: string | null;
  isActive: boolean;
  syncVersion: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export const createUnitSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  shortName: z
    .string()
    .min(1, 'Short name must be at least 1 character')
    .max(10, 'Short name must be at most 10 characters'),
  uqcCode: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;

export const updateUnitSchema = createUnitSchema.partial();

export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;

export const searchUnitsSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type SearchUnitsOptions = z.infer<typeof searchUnitsSchema>;

export interface UnitListDto {
  data: UnitDto[];
  total: number;
}
