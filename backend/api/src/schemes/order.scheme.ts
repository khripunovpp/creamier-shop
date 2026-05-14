import { z } from 'zod';

const adminOrderItemScheme = z.object({
  stock_set_rule_id: z.uuid(),
  flavor_ids: z.array(z.uuid()).min(1).max(4),
  quantity: z.number().int().positive().max(100),
}).strict();

export const adminCreateOrderScheme = z.object({
  items: z.array(adminOrderItemScheme).min(1).max(50),
  name: z.string().min(1).max(255),
  email: z.email().max(255).nullable().optional(),
  phone_number: z.string().max(30).nullable().optional(),
  telegram: z.string().max(100).nullable().optional(),
  whatsapp: z.string().max(30).nullable().optional(),
  delivery_date: z.iso.datetime().nullable().optional(),
  delivery_time: z.string().max(50).nullable().optional(),
  delivery_info: z.record(z.string(), z.unknown()).nullable().optional(),
  delivery_type: z.enum(['pickup', 'delivery']).default('pickup'),
  comment: z.string().max(1000).nullable().optional(),
  status: z.enum(['created', 'paid', 'delivered', 'cancelled', 'returned']).default('created'),
  discount_amount: z.number().nonnegative().default(0),
  payment_method: z.enum(['cash', 'bank_transfer']).nullable().optional(),
  paid_at: z.iso.datetime().nullable().optional(),
}).strict();

export type AdminCreateOrderScheme = z.infer<typeof adminCreateOrderScheme>;

export const adminUpdateOrderScheme = z.object({
  delivery_date: z.iso.datetime().nullable().optional(),
  delivery_time: z.string().max(50).nullable().optional(),
  delivery_info: z.record(z.string(), z.unknown()).nullable().optional(),
  delivery_type: z.enum(['pickup', 'delivery']).optional(),
  comment: z.string().max(1000).nullable().optional(),
  discount_amount: z.number().nonnegative().optional(),
  // mark_paid / mark_delivered have dedicated endpoints with side effects;
  // this endpoint only handles terminal transitions without payment/delivery.
  status: z.enum(['cancelled', 'returned']).optional(),
  customer: z.object({
    name: z.string().min(1).max(255).optional(),
    email: z.email().max(255).nullable().optional(),
    phone_number: z.string().max(30).nullable().optional(),
    telegram: z.string().max(100).nullable().optional(),
    whatsapp: z.string().max(30).nullable().optional(),
  }).strict().optional(),
}).strict();

export type AdminUpdateOrderScheme = z.infer<typeof adminUpdateOrderScheme>;

export const adminAddOrderItemScheme = z.object({
  stock_set_rule_id: z.uuid(),
  flavor_ids: z.array(z.uuid()).min(1).max(4),
  quantity: z.number().int().positive().max(100),
}).strict();
export type AdminAddOrderItemScheme = z.infer<typeof adminAddOrderItemScheme>;

export const adminUpdateOrderItemScheme = z.object({
  quantity: z.number().int().positive().max(100),
}).strict();
export type AdminUpdateOrderItemScheme = z.infer<typeof adminUpdateOrderItemScheme>;
