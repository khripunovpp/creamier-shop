import {z} from 'zod';

const orderItemScheme = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().positive().max(100),
});

export const createOrderScheme = z.object({
  items: z.array(orderItemScheme).min(1).max(50),
  email: z.string().email().max(255).nullable().optional(),
  name: z.string().min(1).max(255),
  delivery_date: z.string().datetime().nullable().optional(),
  delivery_info: z.record(z.string(), z.unknown()).nullable().optional(),
  delivery_type: z.string().max(50).nullable().optional(),
  comment: z.string().max(1000).nullable().optional(),
  phone_number: z.string().max(30).nullable().optional(),
  telegram: z.string().max(100).nullable().optional(),
  whatsapp: z.string().max(30).nullable().optional(),
});

export type CreateOrderScheme = z.infer<typeof createOrderScheme>;