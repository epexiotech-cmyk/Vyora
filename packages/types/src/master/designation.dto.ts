import { z } from 'zod';

export const designationSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  isActive: z.boolean().default(true),
  syncVersion: z.number().int().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export type DesignationDto = z.infer<typeof designationSchema>;

export const createDesignationSchema = designationSchema.omit({
  id: true,
  companyId: true,
  syncVersion: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;

export const updateDesignationSchema = createDesignationSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;

export const searchDesignationsSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchDesignationsOptions = z.infer<typeof searchDesignationsSchema>;

export interface DesignationListDto {
  data: DesignationDto[];
  total: number;
}
