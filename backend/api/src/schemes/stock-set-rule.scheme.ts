import { z } from 'zod';

// Rules are immutable after creation: order_items reference rules by id, so
// changing count/price/max_flavors would silently rewrite history. Admin can
// only add a new rule or delete an unreferenced one.
export const stockSetRuleCreateScheme = z.object({
  count: z.number().int().positive().max(100),
  price: z.number().nonnegative(),
  max_flavors: z.number().int().nonnegative().max(10).default(0),
  position: z.number().int().min(0).default(0),
}).refine(r => r.max_flavors <= r.count, {
  message: 'max_flavors cannot exceed count',
  path: ['max_flavors'],
});
export type CreateStockSetRuleScheme = z.infer<typeof stockSetRuleCreateScheme>;
