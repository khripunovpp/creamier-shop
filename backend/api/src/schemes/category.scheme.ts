import {z} from 'zod'

export const createCategoryScheme = z.object({
  name: z.string().min(1),
});

export type CreateCategoryScheme = z.infer<typeof createCategoryScheme>;

export const updateCategoryScheme = createCategoryScheme.partial();

export type UpdateCategoryScheme = z.infer<typeof updateCategoryScheme>;

