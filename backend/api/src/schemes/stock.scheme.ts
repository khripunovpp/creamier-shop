import {z} from 'zod'

export const stockScheme = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  cost_price: z.number().nonnegative(),
  is_service: z.boolean(),
  quantity: z.number().int().nonnegative(),
  status: z.enum(['stopped', 'active']).default('stopped'),
});

export type CreateStockItemScheme = z.infer<typeof stockScheme>;

export const updateStockItemScheme = stockScheme
  .omit({
    quantity: true,
    is_service: true,
  }).partial();

export type UpdateStockItemScheme = z.infer<typeof updateStockItemScheme>;