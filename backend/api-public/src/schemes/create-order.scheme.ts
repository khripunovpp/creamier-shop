import {z} from 'zod';
import {sanitize} from '../utils/sanitize';

const sanitized = z.string().transform(sanitize);

const orderItemScheme = z.object({
  id: z.uuid(),
  quantity: z.number().int().positive().max(100),
});

export const createOrderScheme = z.object({
  items: z.array(orderItemScheme).min(1).max(50),
  email: z.email().max(255).trim().nullable().optional(),
  name: sanitized.pipe(z.string().min(1).max(255)),
  delivery_date: z.iso.datetime().nullable().optional(),
  delivery_info: z.record(z.string(), z.unknown()).nullable().default(null),
  delivery_type: z.enum(['pickup', 'delivery']).default('pickup'),
  comment: sanitized.pipe(z.string().max(1000)).nullable().optional(),
  phone_number: z.string().trim().max(30).nullable().optional(),
  telegram: sanitized.pipe(z.string().max(100)).nullable().optional(),
  whatsapp: z.string().trim().max(30).nullable().optional(),
}).strict();

export type CreateOrderScheme = z.infer<typeof createOrderScheme>;