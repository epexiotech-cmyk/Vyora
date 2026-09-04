import { z } from 'zod';

export const holidaySchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  date: z.date(),
  isActive: z.boolean().default(true),
  syncVersion: z.number().int().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().nullable().optional(),
});

export type HolidayDto = z.infer<typeof holidaySchema>;

export const createHolidaySchema = holidaySchema.omit({
  id: true,
  companyId: true,
  syncVersion: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;

export const updateHolidaySchema = createHolidaySchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;

export const searchHolidaysSchema = z.object({
  query: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchHolidaysOptions = z.infer<typeof searchHolidaysSchema>;

export interface HolidayListDto {
  data: HolidayDto[];
  total: number;
}
