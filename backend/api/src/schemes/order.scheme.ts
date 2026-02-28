import {z} from 'zod';

export const orderScheme = z.object({
  user_id: z.number(),
  created_at: z.string(),
  completed_at: z.string().nullable(),
  delivery_date: z.string().nullable(),
  status: z.enum(['created', 'paid', 'delivered', 'cancelled', 'returned']),
  total_amount: z.number(),
  discount_amount: z.number(),
  profit_amount: z.number(),
  payment_data: z.record(z.string(), z.any()),
  comment: z.string().nullable(),
  delivery_info: z.object({
    postalCode: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().nullable(),
  }),
  paid_at: z.string().nullable(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer']),
});

export type OrderScheme = z.infer<typeof orderScheme>;