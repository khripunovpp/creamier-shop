import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const stockSetScheme = z.object({
  slug: z.string().regex(slugRegex, 'must be kebab-case').max(64),
  name_ru: z.string().min(1).max(255),
  name_pt: z.string().min(1).max(255),
  description_ru: z.string().max(1000).nullable().optional(),
  description_pt: z.string().max(1000).nullable().optional(),
  status: z.enum(['stopped', 'active', 'archived']).default('stopped'),
  position: z.number().int().min(0).default(0),
});

export type CreateStockSetScheme = z.infer<typeof stockSetScheme>;

// Status is intentionally omitted: it's only changed via dedicated activate/
// deactivate/archive endpoints. Leaving it in this schema lets zod's .default()
// quietly inject 'stopped' whenever the frontend omits it, which would clobber
// the live status on every save.
export const updateStockSetScheme = stockSetScheme.omit({ status: true }).partial();
export type UpdateStockSetScheme = z.infer<typeof updateStockSetScheme>;
