import { z } from 'zod';

export const workLocationSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  address: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  syncVersion: z.number().int().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export type WorkLocationDto = z.infer<typeof workLocationSchema>;

export const createWorkLocationSchema = workLocationSchema.omit({
  id: true,
  companyId: true,
  syncVersion: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type CreateWorkLocationInput = z.infer<typeof createWorkLocationSchema>;

export const updateWorkLocationSchema = createWorkLocationSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateWorkLocationInput = z.infer<typeof updateWorkLocationSchema>;

export const searchWorkLocationsSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchWorkLocationsOptions = z.infer<typeof searchWorkLocationsSchema>;

export interface WorkLocationListDto {
  data: WorkLocationDto[];
  total: number;
}
