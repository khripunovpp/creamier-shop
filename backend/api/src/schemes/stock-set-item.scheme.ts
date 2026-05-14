import { z } from 'zod';

// set_id is bound by the URL path (POST /stock-sets/:set_id/items).
export const stockSetItemCreateScheme = z.object({
  stock_item_id: z.uuid(),
  position: z.number().int().min(0).default(0),
});
export type CreateStockSetItemScheme = z.infer<typeof stockSetItemCreateScheme>;

export const stockSetItemUpdateScheme = z.object({
  position: z.number().int().min(0),
});
export type UpdateStockSetItemScheme = z.infer<typeof stockSetItemUpdateScheme>;
