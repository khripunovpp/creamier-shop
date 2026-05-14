import { z } from 'zod';

export const stockScheme = z.object({
  name: z.string().min(1).max(255),
  name_pt: z.string().min(1).max(255),
  detail_ru: z.string().max(500).nullable().optional(),
  detail_pt: z.string().max(500).nullable().optional(),
  tags_ru: z.array(z.string().max(50)).max(20).nullable().optional(),
  tags_pt: z.array(z.string().max(50)).max(20).nullable().optional(),
  photo_url: z.string().max(500).nullable().optional(),
  position: z.number().int().min(0).default(0),
  price: z.number().nonnegative().default(0),
  cost_price: z.number().nonnegative().default(0),
  status: z.enum(['stopped', 'active']).default('stopped'),
  badge: z.enum(['sale', 'hot']).nullable().optional(),
});

export type CreateStockItemScheme = z.infer<typeof stockScheme>;

// Status is intentionally omitted: it's only changed via dedicated activate/
// deactivate/archive endpoints. Leaving it in this schema lets zod's .default()
// quietly inject 'stopped' whenever the frontend omits it, which would clobber
// the live status on every save.
export const updateStockItemScheme = stockScheme.omit({ status: true }).partial();
export type UpdateStockItemScheme = z.infer<typeof updateStockItemScheme>;
