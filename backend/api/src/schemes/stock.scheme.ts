import {z} from 'zod'

export const stockScheme = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  cost_price: z.number().nonnegative(),
  is_service: z.boolean(),
  status: z.enum(['stopped', 'active']).default('stopped'),
  category_id: z.uuid().nullable().optional(),
  badge: z.enum(['sale', 'hot']).nullable().optional(),
});

export type CreateStockItemScheme = z.infer<typeof stockScheme>;

export const updateStockItemScheme = stockScheme
  .omit({
    is_service: true,
  }).partial();

export type UpdateStockItemScheme = z.infer<typeof updateStockItemScheme>;