import { z } from 'zod';

export const stateSchema = z.object({
  id: z.string().uuid(),
  gstStateCode: z.string(),
  isoCode: z.string(),
  name: z.string(),
  isUnionTerritory: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type StateDto = z.infer<typeof stateSchema>;
