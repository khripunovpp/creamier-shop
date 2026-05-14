import {z} from 'zod';
import {sanitize} from '../utils/sanitize';

const sanitized = z.string().transform(sanitize);

const orderItemScheme = z.object({
  stock_set_rule_id: z.uuid(),
  flavor_ids: z.array(z.uuid()).min(1).max(4),
  quantity: z.number().int().positive().max(100),
}).strict();

export const createOrderScheme = z.object({
  items: z.array(orderItemScheme).min(1).max(50),
  contact_channel: z.enum(['whatsapp', 'telegram', 'phone', 'email']),
  name: sanitized.pipe(z.string().min(1).max(255)),
  email: z.email().max(255).trim().nullable().optional(),
  phone_number: z.string().trim().max(30).nullable().optional(),
  telegram: sanitized.pipe(z.string().max(100)).nullable().optional(),
  whatsapp: z.string().trim().max(30).nullable().optional(),
  delivery_date: z.iso.datetime().nullable().optional(),
  delivery_time: sanitized.pipe(z.string().max(50)).nullable().optional(),
  delivery_info: z.record(z.string(), z.unknown()).nullable().default(null),
  delivery_type: z.enum(['pickup', 'delivery']).default('pickup'),
  comment: sanitized.pipe(z.string().max(1000)).nullable().optional(),
}).strict().refine(
  (data) => {
    switch (data.contact_channel) {
      case 'email':    return !!data.email;
      case 'phone':    return !!data.phone_number;
      case 'telegram': return !!data.telegram;
      case 'whatsapp': return !!data.whatsapp;
    }
  },
  { message: 'Contact value missing for selected channel', path: ['contact_channel'] }
);

export type CreateOrderScheme = z.infer<typeof createOrderScheme>;
